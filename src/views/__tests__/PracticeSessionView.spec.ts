import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeFlashcard, makeQuestion } from '@/__tests__/materialFixtures'
import { makeConversation } from '@/__tests__/conversationFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeSubtopic } from '@/__tests__/topicFixtures'
import type { PracticeMaterial, PracticeOptions, PracticeScope } from '@/lib/practiceSession'
import type { PracticeModeId } from '@/lib/practiceModes'
import { useAuthStore, type User } from '@/stores/auth'
import { usePracticeStore } from '@/stores/practice'
import PracticeSessionView from '../PracticeSessionView.vue'

const photosynthesis = makeSubtopic()

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  email_verified_at: '2026-10-29T12:00:00.000000Z',
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

async function mountSession(modes: PracticeModeId[]): Promise<VueWrapper> {
  const practice = usePracticeStore()
  practice.material = material()
  const options: PracticeOptions = {
    modes,
    cardCount: 20,
    questionCount: 10,
    dueFirst: true,
    interleave: false,
  }
  practice.start(scope, options)
  await router.push('/practice/session')
  const wrapper = mount(PracticeSessionView, { global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

async function flipAndRate(wrapper: VueWrapper, rating: string): Promise<void> {
  await wrapper.get('[data-test="show-answer"]').trigger('click')
  await wrapper.get(`[data-test="rate-${rating}"]`).trigger('click')
}

function front(wrapper: VueWrapper): string {
  return wrapper.get('[data-test="flashcard-front"]').text()
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

  it('sends you to the setup without a plan', async () => {
    await router.push('/practice/session')
    mount(PracticeSessionView, { global: { plugins: [router] } })
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('practice')
  })

  it('shows the rating only after the flip, and brings a card rated again back later', async () => {
    const wrapper = await mountSession(['cards'])

    expect(wrapper.get('[data-test="session-title"]').text()).toBe('Photosynthesis')
    expect(wrapper.find('[data-test="rate-good"]').exists()).toBe(false)
    expect(front(wrapper)).toBe('First front')

    await flipAndRate(wrapper, 'again')
    expect(front(wrapper)).toBe('Second front')
    expect(wrapper.text()).toContain('That one comes back later in this session.')

    await flipAndRate(wrapper, 'good')
    expect(front(wrapper)).toBe('First front')
    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('1 of 2')

    await flipAndRate(wrapper, 'hard')
    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="done-headline"]').text()).toBe('That’s everything you planned.')
    expect(wrapper.get('[data-test="done-tile"]').text()).toContain('50%')
    expect(wrapper.get('[data-test="slipped"]').text()).toContain('First front')
  })

  it('flips with space and rates with 1–4', async () => {
    const wrapper = await mountSession(['cards'])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }))
    await flushPromises()

    expect(front(wrapper)).toBe('Second front')
    expect(usePracticeStore().results[0]?.ratings[0]?.rating).toBe('good')
  })

  it('shows "next up" between the blocks of a mixed session', async () => {
    const wrapper = await mountSession(['cards', 'retrieval'])

    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('Block 1 of 2 · 0 of 2')

    await wrapper.get('[data-test="finish-block"]').trigger('click')
    const nextUp = wrapper.get('[data-test="next-up"]')
    expect(nextUp.text()).toContain('Flashcards done.')
    expect(nextUp.text()).toContain('Retrieval quiz')
    expect(nextUp.text()).toContain('2 questions')

    await wrapper.get('[data-test="skip-next"]').trigger('click')
    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
  })

  it('gives a second try after a wrong pick and shows the answer after the second', async () => {
    const wrapper = await mountSession(['retrieval'])

    expect(wrapper.get('[data-test="check-answer"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-test="option-60"]').trigger('click')
    await wrapper.get('[data-test="check-answer"]').trigger('click')
    expect(wrapper.get('[data-test="quiz-retry"]').text()).toContain('Not quite. Try once more.')
    expect(wrapper.get('[data-test="option-60"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="option-61"]').trigger('click')
    await wrapper.get('[data-test="check-answer"]').trigger('click')
    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('Got it on the second try.')
    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('Question 2 of 2')

    await wrapper.get('[data-test="next-question"]').trigger('click')
    await wrapper.get('[data-test="dont-know"]').trigger('click')
    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('The answer is Green.')
    expect(wrapper.get('[data-test="option-61"]').attributes('data-state')).toBe('missed')

    await wrapper.get('[data-test="next-question"]').trigger('click')
    expect(wrapper.get('[data-test="done-tile"]').text()).toContain('0 of 2')
    expect(usePracticeStore().results[0]?.answers.map((answer) => answer.outcome)).toEqual([
      'second_try',
      'wrong',
    ])
  })

  it('counts a right first pick as right', async () => {
    const wrapper = await mountSession(['retrieval'])

    await wrapper.get('[data-test="option-61"]').trigger('click')
    await wrapper.get('[data-test="check-answer"]').trigger('click')

    expect(wrapper.get('[data-test="quiz-feedback"]').text()).toContain('Correct.')
    expect(wrapper.get('[data-test="option-61"]').attributes('data-state')).toBe('correct')
  })

  it('explains, compares with the cards and simplifies', async () => {
    const wrapper = await mountSession(['feynman'])

    expect(wrapper.get('[data-test="explain-prompt"]').text()).toBe(
      'Explain Photosynthesis as if I’m 12.',
    )
    await wrapper.get('[data-test="first-version"]').setValue('Plants make food.')
    expect(wrapper.get('[data-test="compare"]').attributes('disabled')).toBeDefined()

    await wrapper
      .get('[data-test="first-version"]')
      .setValue('Plants catch light in their leaves and use it to turn water into sugar to grow.')
    await wrapper.get('[data-test="compare"]').trigger('click')
    expect(wrapper.get('[data-test="key-points"]').text()).toContain('In the chloroplasts.')

    await wrapper.get('[data-test="to-simplify"]').trigger('click')
    await wrapper
      .get('[data-test="second-version"]')
      .setValue('Leaves use light, water and air to make sugar.')
    await wrapper.get('[data-test="finish-explain"]').trigger('click')

    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
    expect(usePracticeStore().results[0]?.explanations).toHaveLength(2)
  })

  it('talks it through with the tutor about the topic, then wraps up', async () => {
    const fetchMock = stubApi({
      'GET /user': Response.json(user),
      'POST /conversations': Response.json(makeConversation({ id: 30 }), { status: 201 }),
      'POST /conversations/30/messages': [
        () => Response.json({ message: 'The tutor can’t answer right now.' }, { status: 503 }),
      ],
    })
    const wrapper = await mountSession(['open'])

    await wrapper.findAll('[data-test="suggestion"]')[0]?.trigger('click')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const start = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    const body: unknown = JSON.parse(String(start?.[1]?.body))
    expect(body).toEqual({
      message: 'Quiz me on Photosynthesis. Ask me one question at a time.',
      topic_id: 1,
    })
    expect(wrapper.text()).toContain('What draws you to it')

    await wrapper.get('textarea').setValue('Sport, I think.')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('The tutor can’t answer')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Sport, I think.')

    await wrapper.get('[data-test="wrap-up"]').trigger('click')
    expect(wrapper.get('[data-test="done-tile"]').text()).toContain('1')
  })

  it('ends early with what you did so far', async () => {
    const wrapper = await mountSession(['cards', 'retrieval'])

    await flipAndRate(wrapper, 'good')
    await wrapper.get('[data-test="end-session"]').trigger('click')

    expect(wrapper.get('[data-test="done-headline"]').text()).toBe(
      'Good stop. Here’s what you did.',
    )
    expect(wrapper.text()).toContain('Not reached')
  })

  it('goes again with the same scope and modes', async () => {
    const wrapper = await mountSession(['cards'])
    await wrapper.get('[data-test="end-session"]').trigger('click')

    await wrapper.get('[data-test="done-again"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ modes: 'cards', subtopic: '101' })
  })
})
