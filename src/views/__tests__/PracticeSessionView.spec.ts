import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeFlashcard, makeOpenQuestion, makeQuestion } from '@/__tests__/materialFixtures'
import { makeDone, makePracticeSession } from '@/__tests__/practiceFixtures'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeCategories, makeLibrary, makeSubtopic } from '@/__tests__/topicFixtures'
import type { PracticeMaterial, PracticeOptions, PracticeScope } from '@/lib/practiceSession'
import type { PracticeModeId } from '@/lib/practiceModes'
import type { Flashcard } from '@/stores/flashcards'
import { useAuthStore, type User } from '@/stores/auth'
import { usePracticeStore, type CheckedAnswer } from '@/stores/practice'
import type { Verdict } from '@/stores/questions'
import PracticeSessionView from '../PracticeSessionView.vue'

const photosynthesis = makeSubtopic()

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  pending_email: null,
  email_verified_at: '2026-10-29T12:00:00.000000Z',
  avatar_color: 'sun',
  interests: ['science'],
  wants_daily_reminder: true,
  created_at: '2026-10-29T12:00:00.000000Z',
}

const scope: PracticeScope = {
  topicId: 1,
  topicTitle: 'Biology',
  subtopic: photosynthesis,
  subtopics: [photosynthesis],
}

function material(): PracticeMaterial {
  return {
    flashcards: [
      makeFlashcard({ id: 1, front: 'First front', is_due: true }),
      makeFlashcard({ id: 2, front: 'Second front', is_due: true }),
    ],
    // Options: Red (60, wrong) and Green (61, right).
    questions: [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })],
  }
}

type Routes = Parameters<typeof stubApi>[0]

const finished = makePracticeSession({
  is_finished: true,
  xp_earned: 14,
  streak_days: 3,
  subtopics: [
    {
      id: 101,
      title: 'Photosynthesis',
      mastery_before: 20,
      mastery_after: 34,
      next_review_on: null,
    },
  ],
})

/** A card saved with its new schedule. */
function reviewed(card: Flashcard): () => Response {
  return () => Response.json({ flashcard: card, subtopic: photosynthesis }, { status: 201 })
}

/** A checked answer; a wrong first pick (`tryAgain`) has no score yet. */
function answered(
  verdict: Verdict,
  extra: Partial<CheckedAnswer> = {},
  tryAgain = false,
): () => Response {
  const answer: CheckedAnswer = {
    response: null,
    option_id: null,
    score: tryAgain ? null : verdict === 'correct' ? 100 : verdict === 'almost' ? 60 : 0,
    verdict,
    feedback: null,
    gaps: null,
    answered_at: '2026-10-31T09:00:00.000000Z',
    ...extra,
  }
  return () =>
    Response.json(
      { answer, try_again: tryAgain, subtopic: tryAgain ? null : photosynthesis },
      { status: 201 },
    )
}

async function mountSession(
  modes: PracticeModeId[],
  routes: Routes = {},
  {
    attachTo,
    secondTry = true,
    scopeMaterial = material(),
  }: { attachTo?: HTMLElement; secondTry?: boolean; scopeMaterial?: PracticeMaterial } = {},
): Promise<{ wrapper: VueWrapper; fetchMock: ReturnType<typeof stubApi> }> {
  const fetchMock = stubApi({
    'POST /practice-sessions': Response.json(makePracticeSession(), { status: 201 }),
    'POST /practice-sessions/52/finish': Response.json(finished),
    ...routes,
  })
  const practice = usePracticeStore()
  practice.material = scopeMaterial
  const options: PracticeOptions = {
    modes,
    cardCount: 20,
    questionCount: 10,
    dueFirst: true,
    interleave: false,
    secondTry,
  }
  await practice.start(scope, options)
  await router.push('/practice/session')
  const wrapper = mount(PracticeSessionView, { global: { plugins: [router] }, attachTo })
  await flushPromises()

  return { wrapper, fetchMock }
}

/** The JSON bodies sent to a route, in order. */
function sentTo(fetchMock: ReturnType<typeof stubApi>, route: string): unknown[] {
  const [method, path] = route.split(' ')
  return fetchMock.mock.calls
    .filter(
      ([input, init]) => String(input).endsWith(path ?? '') && (init?.method ?? 'GET') === method,
    )
    .map(([, init]) => JSON.parse(String(init?.body)))
}

async function flipAndRate(wrapper: VueWrapper, rating: string): Promise<void> {
  await wrapper.get('[data-test="show-answer"]').trigger('click')
  await wrapper.get(`[data-test="rate-${rating}"]`).trigger('click')
  await flushPromises()
}

async function click(wrapper: VueWrapper, selector: string): Promise<void> {
  await wrapper.get(selector).trigger('click')
  await flushPromises()
}

function front(wrapper: VueWrapper): string {
  return wrapper.get('[data-test="flashcard-front"]').text()
}

const cardRoutes: Routes = {
  'POST /flashcards/1/reviews': reviewed(makeFlashcard({ id: 1, front: 'First front' })),
  'POST /flashcards/2/reviews': reviewed(makeFlashcard({ id: 2, front: 'Second front' })),
}

describe('PracticeSessionView', () => {
  beforeAll(() => {
    // jsdom doesn't implement it; the open session scrolls to the newest message.
    Element.prototype.scrollIntoView = vi.fn<() => void>()
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends you to the setup when there’s no session to pick up', async () => {
    stubApi({ 'GET /practice-sessions/current': new Response(null, { status: 204 }) })
    await router.push('/practice/session')
    mount(PracticeSessionView, { global: { plugins: [router] } })
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('practice')
  })

  it('picks up today’s session after a reload, with the cards you didn’t rate yet', async () => {
    stubApi({
      'GET /practice-sessions/current': Response.json(
        makePracticeSession({
          plan: { modes: ['cards'], card_ids: [1, 2], question_ids: [], explain_subtopic_id: null },
          done: makeDone({
            flashcard_reviews: [{ flashcard_id: 1, rating: 'good', reviewed_at: '' }],
          }),
        }),
      ),
      'GET /topics': Response.json(makeLibrary()),
      'GET /categories': Response.json(makeCategories()),
      'GET /settings': Response.json(makeSettings()),
      'GET /subtopics/101/flashcards': Response.json(material().flashcards),
      'GET /subtopics/101/questions': Response.json([]),
    })
    await router.push('/practice/session')
    const wrapper = mount(PracticeSessionView, { global: { plugins: [router] } })
    await flushPromises()

    expect(front(wrapper)).toBe('Second front')
    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('1 of 2')
  })

  it('saves every rating, shows when the card comes back and brings one rated again back later', async () => {
    const { wrapper, fetchMock } = await mountSession(['cards'], cardRoutes)

    expect(wrapper.get('[data-test="session-title"]').text()).toBe('Photosynthesis')
    expect(wrapper.find('[data-test="rate-good"]').exists()).toBe(false)
    expect(front(wrapper)).toBe('First front')

    await wrapper.get('[data-test="show-answer"]').trigger('click')
    expect(wrapper.get('[data-test="rate-again"]').text()).toContain('10 min')
    expect(wrapper.get('[data-test="rate-good"]').text()).toContain('8 days')
    await click(wrapper, '[data-test="rate-again"]')
    expect(front(wrapper)).toBe('Second front')
    expect(wrapper.text()).toContain('That one comes back later in this session.')

    await flipAndRate(wrapper, 'good')
    expect(front(wrapper)).toBe('First front')
    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('1 of 2')

    await flipAndRate(wrapper, 'hard')
    expect(sentTo(fetchMock, 'POST /flashcards/1/reviews')).toEqual([
      { rating: 'again', practice_session_id: 52 },
      { rating: 'hard', practice_session_id: 52 },
    ])
    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="done-headline"]').text()).toBe('That’s everything you planned.')
    expect(wrapper.get('[data-test="done-tile"]').text()).toContain('50%')
    expect(wrapper.get('[data-test="slipped"]').text()).toContain('First front')
  })

  it('keeps the card when a rating can’t be saved', async () => {
    const { wrapper } = await mountSession(['cards'], {
      'POST /flashcards/1/reviews': Response.json(
        { message: 'Can’t reach Sprout right now.' },
        { status: 500 },
      ),
    })

    await flipAndRate(wrapper, 'good')

    expect(front(wrapper)).toBe('First front')
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Can’t reach Sprout')
  })

  it('flips with space and rates with 1–4', async () => {
    const { wrapper } = await mountSession(['cards'], cardRoutes)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }))
    await flushPromises()

    expect(front(wrapper)).toBe('Second front')
    expect(usePracticeStore().results[0]?.ratings[0]?.rating).toBe('good')
  })

  it('rates with 1–4 right after you click the card', async () => {
    // Attached, so the key press bubbles from the card up to the window.
    const { wrapper } = await mountSession(['cards'], cardRoutes, { attachTo: document.body })

    const card = wrapper.get('[data-test="flashcard"]')
    await card.trigger('click')
    await card.trigger('keydown', { key: '1' })
    await flushPromises()

    expect(usePracticeStore().results[0]?.ratings[0]?.rating).toBe('again')
    wrapper.unmount()
  })

  it('shows "next up" between the blocks of a mixed session', async () => {
    const { wrapper } = await mountSession(['cards', 'retrieval'])

    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('Block 1 of 2 · 0 of 2')

    await click(wrapper, '[data-test="finish-block"]')
    const nextUp = wrapper.get('[data-test="next-up"]')
    expect(nextUp.text()).toContain('Flashcards done.')
    expect(nextUp.text()).toContain('Retrieval quiz')
    expect(nextUp.text()).toContain('2 questions')

    await click(wrapper, '[data-test="skip-next"]')
    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
    // The cards were left halfway, so it wasn't everything you planned.
    expect(wrapper.get('[data-test="done-headline"]').text()).toBe(
      'Good stop. Here’s what you did.',
    )
  })

  it('gives a second try after a wrong pick and shows the answer after the second', async () => {
    const { wrapper, fetchMock } = await mountSession(['retrieval'], {
      'POST /questions/1/answers': [
        answered('not_quite', { option_id: 60, feedback: 'Red is absorbed well.' }, true),
        answered('almost', { option_id: 61, feedback: 'Green is reflected.' }),
      ],
      'POST /questions/2/answers': answered('not_quite'),
    })

    expect(wrapper.get('[data-test="check-answer"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-test="option-60"]').trigger('click')
    await click(wrapper, '[data-test="check-answer"]')
    expect(wrapper.get('[data-test="quiz-retry"]').text()).toContain('Not quite. Try once more.')
    expect(wrapper.get('[data-test="quiz-retry"]').text()).toContain('Red is absorbed well.')
    expect(wrapper.get('[data-test="option-60"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="option-61"]').trigger('click')
    await click(wrapper, '[data-test="check-answer"]')
    expect(sentTo(fetchMock, 'POST /questions/1/answers')).toEqual([
      { option_id: 60, second_try: false, practice_session_id: 52 },
      { option_id: 61, second_try: true, practice_session_id: 52 },
    ])
    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('Got it on the second try.')
    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('Question 2 of 2')

    await click(wrapper, '[data-test="next-question"]')
    await click(wrapper, '[data-test="dont-know"]')
    expect(sentTo(fetchMock, 'POST /questions/2/answers')).toEqual([
      { dont_know: true, practice_session_id: 52 },
    ])
    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('The answer is Green.')
    expect(wrapper.get('[data-test="option-61"]').attributes('data-state')).toBe('missed')

    await click(wrapper, '[data-test="next-question"]')
    expect(wrapper.get('[data-test="done-tile"]').text()).toContain('0 of 2')
    expect(usePracticeStore().results[0]?.answers.map((answer) => answer.outcome)).toEqual([
      'almost',
      'not_quite',
    ])
  })

  it('ends the question after one wrong pick when you turned the hint off', async () => {
    const { wrapper, fetchMock } = await mountSession(
      ['retrieval'],
      {
        'POST /questions/1/answers': [
          answered('not_quite', { option_id: 60 }, true),
          answered('not_quite'),
        ],
      },
      { secondTry: false },
    )

    await wrapper.get('[data-test="option-60"]').trigger('click')
    await click(wrapper, '[data-test="check-answer"]')

    expect(sentTo(fetchMock, 'POST /questions/1/answers')).toEqual([
      { option_id: 60, second_try: false, practice_session_id: 52 },
      { dont_know: true, practice_session_id: 52 },
    ])
    expect(wrapper.find('[data-test="quiz-retry"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('The answer is Green.')
  })

  it('counts a right first pick as right', async () => {
    const { wrapper } = await mountSession(['retrieval'], {
      'POST /questions/1/answers': answered('correct', { option_id: 61 }),
    })

    await wrapper.get('[data-test="option-61"]').trigger('click')
    await click(wrapper, '[data-test="check-answer"]')

    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('Correct.')
    expect(wrapper.get('[data-test="option-61"]').attributes('data-state')).toBe('correct')
  })

  it('lets Sprout check an open answer, and keeps it when that fails', async () => {
    const { wrapper, fetchMock } = await mountSession(
      ['retrieval'],
      {
        'POST /questions/1/answers': [
          () => Response.json({ message: 'The tutor can’t answer right now.' }, { status: 503 }),
          answered('almost', { feedback: 'Light: right. You’re missing the air.' }),
        ],
      },
      {
        scopeMaterial: {
          flashcards: [],
          questions: [makeOpenQuestion({ id: 1, latest_answer: null })],
        },
      },
    )
    expect(wrapper.text()).toContain('Open question')

    await wrapper.get('[data-test="open-answer"]').setValue('Light gives the energy.')
    await click(wrapper, '[data-test="check-answer"]')
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('The tutor can’t answer')
    expect((wrapper.get('[data-test="open-answer"]').element as HTMLTextAreaElement).value).toBe(
      'Light gives the energy.',
    )

    await click(wrapper, '[data-test="check-answer"]')
    expect(sentTo(fetchMock, 'POST /questions/1/answers')[1]).toEqual({
      response: 'Light gives the energy.',
      practice_session_id: 52,
    })
    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('Almost there.')
    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('missing the air')
  })

  it('explains, finds the gaps and simplifies', async () => {
    const first = 'Plants catch light in their leaves and use it to turn water into sugar to grow.'
    const { wrapper, fetchMock } = await mountSession(['feynman'], {
      'POST /subtopics/101/explanations': [
        () =>
          Response.json({
            question: { id: 31, prompt: 'Explain Photosynthesis as if I’m 12.' },
            answer: {
              response: first,
              option_id: null,
              score: 70,
              verdict: 'almost',
              feedback: 'You have the light part right.',
              gaps: [{ text: 'turn water into sugar', note: 'What else does the plant take in?' }],
              answered_at: '',
            },
            subtopic: photosynthesis,
          }),
        () =>
          Response.json({
            question: { id: 31, prompt: 'Explain Photosynthesis as if I’m 12.' },
            answer: {
              response: 'Leaves use light, water and air to make sugar.',
              option_id: null,
              score: null,
              verdict: null,
              feedback: 'Clearer: now the air is in it.',
              gaps: [],
              answered_at: '',
            },
            subtopic: null,
          }),
      ],
    })

    expect(wrapper.get('[data-test="explain-prompt"]').text()).toBe(
      'Explain Photosynthesis as if I’m 12.',
    )
    await wrapper.get('[data-test="first-version"]').setValue('Plants make food.')
    expect(wrapper.get('[data-test="find-gaps"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="first-version"]').setValue(first)
    await click(wrapper, '[data-test="find-gaps"]')
    expect(wrapper.get('[data-test="gap"]').text()).toContain('turn water into sugar')
    expect(wrapper.get('[data-test="gap-notes"]').text()).toContain('What else does the plant')
    expect(wrapper.get('[data-test="explain-feedback"]').text()).toContain('the light part right')

    await click(wrapper, '[data-test="to-simplify"]')
    await wrapper
      .get('[data-test="second-version"]')
      .setValue('Leaves use light, water and air to make sugar.')
    await click(wrapper, '[data-test="check-second"]')
    expect(wrapper.get('[data-test="explain-feedback"]').text()).toContain('now the air is in it')
    expect(sentTo(fetchMock, 'POST /subtopics/101/explanations')).toEqual([
      { explanation: first, version: 1, practice_session_id: 52 },
      {
        explanation: 'Leaves use light, water and air to make sugar.',
        version: 2,
        practice_session_id: 52,
      },
    ])

    await click(wrapper, '[data-test="finish-explain"]')
    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
    expect(usePracticeStore().results[0]?.explanations).toHaveLength(2)
  })

  it('talks it through with the practice tutor, then wraps up', async () => {
    const { wrapper, fetchMock } = await mountSession(['open'], {
      'GET /user': Response.json(user),
      'POST /practice-sessions/52/messages': [
        () =>
          Response.json(
            {
              message: {
                id: 301,
                role: 'user',
                content: 'Quiz me',
                technique: null,
                created_at: '',
              },
              reply: {
                id: 302,
                role: 'tutor',
                content: 'Which colours does chlorophyll absorb?',
                technique: 'retrieval_practice',
                created_at: '',
              },
            },
            { status: 201 },
          ),
        () => Response.json({ message: 'The tutor can’t answer right now.' }, { status: 503 }),
      ],
    })

    await wrapper.findAll('[data-test="suggestion"]')[0]?.trigger('click')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(sentTo(fetchMock, 'POST /practice-sessions/52/messages')[0]).toEqual({
      message: 'Quiz me on Photosynthesis. Ask me one question at a time.',
    })
    expect(wrapper.text()).toContain('Which colours does chlorophyll absorb?')
    expect(wrapper.get('[data-test="technique"]').text()).toBe('Retrieval practice')

    await wrapper.get('textarea').setValue('Red and blue.')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('The tutor can’t answer')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Red and blue.')

    await click(wrapper, '[data-test="wrap-up"]')
    expect(wrapper.get('[data-test="done-tile"]').text()).toContain('1')
  })

  it('shows what the session earned: XP, streak and mastery', async () => {
    const { wrapper } = await mountSession(['cards'], cardRoutes)

    await flipAndRate(wrapper, 'good')
    await click(wrapper, '[data-test="end-session"]')

    expect(wrapper.get('[data-test="done-headline"]').text()).toBe(
      'Good stop. Here’s what you did.',
    )
    expect(wrapper.get('[data-test="done-xp"]').text()).toContain('+14 XP')
    expect(wrapper.get('[data-test="done-streak"]').text()).toBe('3-day streak')
    expect(wrapper.get('[data-test="mastery-changes"]').text()).toContain('20% → 34%')
    expect(wrapper.get('[data-test="done-lede"]').text()).toContain('About 6 min.')
  })

  it('says nothing was practised when the API kept nothing', async () => {
    const { wrapper } = await mountSession(['cards', 'retrieval'], {
      'POST /practice-sessions/52/finish': new Response(null, { status: 204 }),
    })

    await click(wrapper, '[data-test="end-session"]')

    expect(wrapper.get('[data-test="done-headline"]').text()).toBe('Nothing practised this time.')
    expect(wrapper.find('[data-test="done-xp"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Not reached')
  })

  it('stays in the block when the session can’t be finished', async () => {
    const { wrapper } = await mountSession(['cards'], {
      'POST /practice-sessions/52/finish': Response.json(
        { message: 'Can’t reach Sprout right now.' },
        { status: 500 },
      ),
    })

    await click(wrapper, '[data-test="end-session"]')

    expect(wrapper.find('[data-test="flashcard-block"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Can’t reach Sprout')
  })

  it('goes again with the same scope and modes', async () => {
    const { wrapper } = await mountSession(['cards'])
    await click(wrapper, '[data-test="end-session"]')

    await click(wrapper, '[data-test="done-again"]')

    expect(router.currentRoute.value.query).toEqual({ modes: 'cards', subtopic: '101' })
  })
})
