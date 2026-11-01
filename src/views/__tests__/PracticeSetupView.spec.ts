import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeFlashcard, makeOpenQuestion, makeQuestion } from '@/__tests__/materialFixtures'
import { makePracticeSession } from '@/__tests__/practiceFixtures'
import { makeSettings, makeUser } from '@/__tests__/settingsFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeCategories, makeLibrary } from '@/__tests__/topicFixtures'
import { useAuthStore } from '@/stores/auth'
import { usePracticeStore } from '@/stores/practice'
import PracticeSetupView from '../PracticeSetupView.vue'

type Routes = Parameters<typeof stubApi>[0]

// Photosynthesis (101) has a card, a multiple choice and an open question; the other Biology
// subtopics have nothing yet.
function material(): Routes {
  return {
    'GET /subtopics/101/flashcards': Response.json([makeFlashcard({ is_due: true })]),
    'GET /subtopics/101/questions': Response.json([makeQuestion(), makeOpenQuestion()]),
    'GET /subtopics/102/flashcards': Response.json([]),
    'GET /subtopics/102/questions': Response.json([]),
    'GET /subtopics/103/flashcards': Response.json([]),
    'GET /subtopics/103/questions': Response.json([]),
  }
}

async function mountSetup(url: string, routes: Routes = {}): Promise<VueWrapper> {
  stubApi({
    // The app shell around the page.
    'GET /user': Response.json(makeUser()),
    'GET /conversations': Response.json([]),
    'GET /settings': Response.json(makeSettings()),
    'GET /topics': Response.json(makeLibrary()),
    'GET /categories': Response.json(makeCategories()),
    'GET /practice-sessions/current': new Response(null, { status: 204 }),
    ...material(),
    ...routes,
  })
  await router.push(url)
  const wrapper = mount(PracticeSetupView, { global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

function pressed(wrapper: VueWrapper, test: string): boolean {
  return wrapper.get(`[data-test="${test}"]`).attributes('aria-pressed') === 'true'
}

describe('PracticeSetupView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the app navigation around the page', async () => {
    const wrapper = await mountSetup('/practice')

    expect(wrapper.find('[data-test="tab-bar"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'AppSidebar' }).exists()).toBe(true)
  })

  it('opens prefilled from the URL', async () => {
    const wrapper = await mountSetup('/practice?subtopic=101&modes=retrieval')

    expect(pressed(wrapper, 'scope-101')).toBe(true)
    expect(pressed(wrapper, 'mode-retrieval')).toBe(true)
    expect(pressed(wrapper, 'mode-cards')).toBe(false)
    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Retrieval quiz')
    expect(wrapper.text()).toContain('2 questions')
  })

  it('mixes every mode that can run except the open session, which you add yourself', async () => {
    const wrapper = await mountSetup('/practice?subtopic=101')

    await wrapper.get('[data-test="mode-mix"]').trigger('click')

    expect(pressed(wrapper, 'mode-mix')).toBe(true)
    expect(pressed(wrapper, 'mode-open')).toBe(false)
    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Mixed session')
    expect(wrapper.findAll('[data-test="summary-blocks"] li').map((item) => item.text())).toEqual([
      '1Flashcards1 card',
      '2Retrieval quiz2 questions',
      '3Explain it1 concept, 4 steps',
    ])
    // 0.4 + 2 + 12 minutes.
    expect(wrapper.get('[data-test="summary-time"]').text()).toBe('About 14 min')

    // The open session goes last, and the mix stays on.
    await wrapper.get('[data-test="mode-open"]').trigger('click')
    expect(wrapper.findAll('[data-test="summary-blocks"] li')[3]?.text()).toBe(
      '4Open sessionAs long as you like',
    )
    expect(pressed(wrapper, 'mode-mix')).toBe(true)

    // Switching the mix off keeps the first mode and the open session you added.
    await wrapper.get('[data-test="mode-mix"]').trigger('click')
    expect(wrapper.findAll('[data-test="summary-blocks"] li').map((item) => item.text())).toEqual([
      '1Flashcards1 card',
      '2Open sessionAs long as you like',
    ])
  })

  it('lets you switch the last mode off and asks you to pick one', async () => {
    const wrapper = await mountSetup('/practice?subtopic=101&modes=cards')

    await wrapper.get('[data-test="mode-cards"]').trigger('click')

    expect(pressed(wrapper, 'mode-cards')).toBe(false)
    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Pick a way to practise')
    expect(wrapper.get('[data-test="start-session"]').attributes('disabled')).toBeDefined()

    // Another scope doesn't pick one for you.
    await router.push('/practice?subtopic=102')
    await flushPromises()
    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Pick a way to practise')
  })

  it('only asks how much when flashcards or the quiz is on', async () => {
    const wrapper = await mountSetup('/practice?subtopic=101&modes=feynman,open')

    expect(wrapper.find('[data-test="step-amount"]').exists()).toBe(false)

    await wrapper.get('[data-test="mode-cards"]').trigger('click')
    expect(wrapper.find('[data-test="step-amount"]').exists()).toBe(true)
  })

  it('says why a mode can’t run, and offers no mix with only one other mode', async () => {
    const wrapper = await mountSetup('/practice?subtopic=102&modes=cards')

    expect(wrapper.get('[data-test="mode-cards"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="mode-cards"]').text()).toContain('No flashcards here yet.')
    // Cards can't run here, so the first mode that can is picked instead.
    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Explain it')
    // Only Explain it and the open session can run, and the mix leaves the open session out.
    expect(wrapper.get('[data-test="mode-mix"]').attributes('disabled')).toBeDefined()
  })

  it('keeps the last summary while another subtopic’s cards load', async () => {
    let answerCards: (response: Response) => void = () => {}
    const wrapper = await mountSetup('/practice?subtopic=101', {
      'GET /subtopics/102/flashcards': () =>
        new Promise<Response>((resolve) => {
          answerCards = resolve
        }),
    })
    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Flashcards')

    await wrapper.get('[data-test="scope-102"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Flashcards')
    expect(wrapper.get('[data-test="start-session"]').text()).toBe('Getting your cards…')

    answerCards(Response.json([]))
    await flushPromises()

    expect(wrapper.get('[data-test="summary-title"]').text()).toBe('Explain it')
    expect(wrapper.get('[data-test="start-session"]').text()).toBe('Start session')
  })

  it('loads the cards of the whole topic and offers interleaving', async () => {
    const wrapper = await mountSetup('/practice?topic=1')

    expect(pressed(wrapper, 'scope-whole')).toBe(true)
    expect(wrapper.find('[data-test="whole-topic-tip"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="interleave"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Biology · mixed subtopics')
  })

  it('starts the session with the plan and opens it', async () => {
    const wrapper = await mountSetup('/practice?subtopic=101&modes=cards,retrieval', {
      'POST /practice-sessions': Response.json(makePracticeSession(), { status: 201 }),
    })

    await wrapper.get('[data-test="start-session"]').trigger('click')
    await flushPromises()

    const plan = usePracticeStore().plan
    expect(plan?.blocks.map((block) => block.mode)).toEqual(['cards', 'retrieval'])
    expect(router.currentRoute.value.name).toBe('practice-session')
  })

  it('stays on the setup with the API’s message when the session can’t start', async () => {
    const wrapper = await mountSetup('/practice?subtopic=101&modes=cards', {
      'POST /practice-sessions': Response.json(
        {
          message: 'The given data was invalid.',
          errors: { topic_id: ['Pick one of your topics to practise.'] },
        },
        { status: 422 },
      ),
    })

    await wrapper.get('[data-test="start-session"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('practice')
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('The given data was invalid.')
  })

  it('offers to pick up the session still going today', async () => {
    const wrapper = await mountSetup('/practice', {
      'GET /practice-sessions/current': Response.json(makePracticeSession()),
    })

    const current = wrapper.get('[data-test="current-session"]')
    expect(current.text()).toContain('Photosynthesis')
    expect(current.get('a').attributes('href')).toBe('/practice/session')
  })

  it('starts from your learning defaults in settings', async () => {
    const wrapper = await mountSetup('/practice?topic=1&modes=cards,retrieval', {
      'GET /settings': Response.json(
        makeSettings({ session_size: 40, interleave_subtopics: false, hint_before_answer: false }),
      ),
      'POST /practice-sessions': Response.json(makePracticeSession(), { status: 201 }),
    })

    expect(
      wrapper.find('[data-test="interleave"] [role="switch"]').attributes('aria-checked'),
    ).toBe('false')
    await wrapper.get('[data-test="start-session"]').trigger('click')
    await flushPromises()

    expect(usePracticeStore().plan?.options).toMatchObject({
      cardCount: 40,
      questionCount: 20,
      interleave: false,
      secondTry: false,
    })
  })

  it('only promises a second try in the quiz when you get one', async () => {
    const withHint = await mountSetup('/practice?subtopic=101&modes=retrieval', {
      'GET /settings': Response.json(makeSettings({ hint_before_answer: true })),
    })
    expect(withHint.get('[data-test="why-this-helps"]').text()).toContain('second try')

    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
    const withoutHint = await mountSetup('/practice?subtopic=101&modes=retrieval', {
      'GET /settings': Response.json(makeSettings({ hint_before_answer: false })),
    })
    expect(withoutHint.get('[data-test="why-this-helps"]').text()).not.toContain('second try')
  })

  it('points to the knowledge map when there is nothing to practise', async () => {
    const wrapper = await mountSetup('/practice', { 'GET /topics': Response.json([]) })

    expect(wrapper.find('[data-test="empty-library"]').exists()).toBe(true)
  })

  it('shows the API’s message when your cards can’t be loaded', async () => {
    const wrapper = await mountSetup('/practice?subtopic=101', {
      'GET /subtopics/101/flashcards': Response.json(
        { message: 'Can’t reach Sprout right now.' },
        { status: 503 },
      ),
    })

    expect(wrapper.get('[data-test="form-error"]').text()).toContain(
      'Can’t reach Sprout right now.',
    )
    expect(wrapper.get('[data-test="start-session"]').attributes('disabled')).toBeDefined()
  })
})
