import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeConversation, makeMaterial, makeSummary } from '@/__tests__/conversationFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeLibrary, makeTopic } from '@/__tests__/topicFixtures'
import { useAuthStore, type User } from '@/stores/auth'
import DashboardView from '../DashboardView.vue'

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  pending_email: null,
  email_verified_at: '2026-10-29T12:00:00.000000Z',
  avatar_color: 'sun',
  interests: ['maths'],
  wants_daily_reminder: true,
  created_at: '2026-10-29T12:00:00.000000Z',
}

async function mountDashboard(): Promise<VueWrapper> {
  const wrapper = mount(DashboardView, { global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

describe('DashboardView', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
    await router.push('/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('greets you by first name and shows your initials', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
    })

    const wrapper = await mountDashboard()

    expect(wrapper.get('h1').text()).toMatch(/^Good (morning|afternoon|evening), Ada$/)
    expect(wrapper.get('[data-test="account"]').text()).toContain('AL')
    expect(wrapper.get('[data-test="account"]').text()).toContain('Ada Lovelace')
  })

  it('shows every section of the dashboard', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
    })

    const wrapper = await mountDashboard()

    const headings = wrapper.findAll('main h2').map((heading) => heading.text())
    expect(headings).toEqual([
      'What do you want to understand today?',
      'Today’s retention queue',
      'Start a practice session',
    ])
  })

  it('offers the same four ways to practise as the topics page', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
    })

    const wrapper = await mountDashboard()

    const practice = wrapper.get('[aria-labelledby="practice-heading"]')
    expect(
      practice.findAll('button').map((card) => card.find('span:nth-of-type(2)').text()),
    ).toEqual(['Flashcards', 'Retrieval quiz', 'Explain it', 'Open session'])
  })

  it('opens the practice setup with the mode you pick', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
    })
    const wrapper = await mountDashboard()

    await wrapper.get('[data-test="practice-mode-feynman"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/practice?modes=feynman')
  })

  it('opens the practice setup from Open practice center', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
    })
    const wrapper = await mountDashboard()

    expect(wrapper.get('[data-test="practice-center"]').attributes('href')).toBe('/practice')
  })

  describe('the retention queue', () => {
    function stubLibrary(topics: Response): void {
      stubApi({
        'GET /user': Response.json(user),
        'GET /topics': topics,
        'GET /conversations': Response.json([]),
      })
    }

    it('lists the topics with cards due, slipping first, and counts every due card', async () => {
      stubLibrary(Response.json(makeLibrary()))
      const wrapper = await mountDashboard()

      const items = wrapper.findAll('[data-test="queue-item"]')
      expect(items.map((item) => item.text())).toEqual([
        expect.stringMatching(/^Biology\s*9 cards · slipping\s*61%\s*mastery$/),
        expect.stringMatching(/^Computer science\s*2 cards · due today/),
      ])
      expect(items[0]?.attributes('href')).toBe('/practice?topic=1&modes=cards')
      expect(wrapper.get('[aria-labelledby="queue-heading"]').text()).toContain('11 due')
    })

    it('starts a flashcard review of the most urgent topic', async () => {
      stubLibrary(Response.json(makeLibrary()))
      const wrapper = await mountDashboard()

      const start = wrapper.get('[data-test="start-review"]')
      expect(start.text()).toBe('Start review · about 4 min')

      await start.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.fullPath).toBe('/practice?topic=1&modes=cards')
    })

    it('says when nothing is due today', async () => {
      stubLibrary(Response.json([makeTopic()]))
      const wrapper = await mountDashboard()

      expect(wrapper.get('[data-test="queue-done"]').text()).toContain('Nothing due today')
      expect(wrapper.find('[data-test="start-review"]').exists()).toBe(false)
    })

    it('points to your topics when your library is empty', async () => {
      stubLibrary(Response.json([]))
      const wrapper = await mountDashboard()

      const empty = wrapper.get('[data-test="queue-empty-library"]')
      expect(empty.get('a').attributes('href')).toBe('/topics')
      expect(wrapper.find('[data-test="mastered-topics"]').exists()).toBe(false)
    })

    it('shows why the library didn’t load and tries again', async () => {
      let attempts = 0
      stubApi({
        'GET /user': Response.json(user),
        'GET /conversations': Response.json([]),
        'GET /topics': () => {
          attempts += 1

          return attempts === 1
            ? Response.json({ message: 'Can’t reach Sprout right now.' }, { status: 500 })
            : Response.json(makeLibrary())
        },
      })
      const wrapper = await mountDashboard()

      expect(wrapper.get('[data-test="form-error"]').text()).toBe('Can’t reach Sprout right now.')

      await wrapper.get('[data-test="queue-retry"]').trigger('click')
      await flushPromises()

      expect(wrapper.findAll('[data-test="queue-item"]')).toHaveLength(2)
    })
  })

  it('counts the topics you’ve mastered', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json(makeLibrary()),
      'GET /conversations': Response.json([]),
    })
    const wrapper = await mountDashboard()

    expect(wrapper.get('[data-test="mastered-topics"]').text()).toBe('0 of 4 topics mastered')
  })

  it('starts a conversation with your first message and opens it', async () => {
    let answerTutor: (response: Response) => void = () => {}
    const fetchMock = stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
      'POST /conversations': () =>
        // Held back so we can see the screen while the tutor is still answering.
        new Promise<Response>((resolve) => (answerTutor = resolve)),
      'GET /conversations/10': Response.json(makeConversation()),
    })
    const wrapper = await mountDashboard()

    await wrapper.get('[data-test="composer-input"]').setValue('I want to learn about running')
    await wrapper.get('[data-test="composer-send"]').trigger('click')

    expect(wrapper.get('[data-test="pending-message"]').text()).toContain(
      'I want to learn about running',
    )
    expect(wrapper.find('[data-test="typing"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="composer-send"]').attributes('disabled')).toBeDefined()

    answerTutor(Response.json(makeConversation(), { status: 201 }))
    await flushPromises()

    expect(JSON.parse(String(fetchMock.mock.lastCall?.[1]?.body))).toEqual({
      message: 'I want to learn about running',
    })
    expect(router.currentRoute.value.fullPath).toBe('/conversations/10')
  })

  it('starts a conversation with your files on the first message', async () => {
    let answerTutor: (response: Response) => void = () => {}
    const fetchMock = stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
      'POST /materials': () => Response.json(makeMaterial({ status: 'ready' }), { status: 201 }),
      'POST /conversations': () => new Promise<Response>((resolve) => (answerTutor = resolve)),
      'GET /conversations/10': Response.json(makeConversation()),
    })
    const wrapper = await mountDashboard()

    const input = wrapper.get('[data-test="file-input"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['notes'], 'Lecture 1.pdf')],
      configurable: true,
    })
    await input.trigger('change')
    await flushPromises()
    expect(wrapper.get('[data-test="composer-input"]').attributes('placeholder')).toBe(
      'Say what you want to learn from these files…',
    )

    await wrapper.get('[data-test="composer-input"]').setValue('Here are my lecture notes')
    await wrapper.get('[data-test="composer-send"]').trigger('click')
    // Your message shows with its file while the tutor answers.
    expect(wrapper.get('[data-test="pending-message"]').text()).toContain('Lecture 1.pdf')

    answerTutor(Response.json(makeConversation(), { status: 201 }))
    await flushPromises()

    expect(JSON.parse(String(fetchMock.mock.lastCall?.[1]?.body))).toEqual({
      message: 'Here are my lecture notes',
      material_ids: [7],
    })
    expect(router.currentRoute.value.fullPath).toBe('/conversations/10')
  })

  it('gives your message back when the tutor can’t answer', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
      'POST /conversations': () =>
        Response.json(
          { message: 'The tutor can’t answer right now. Try again in a moment.' },
          { status: 503 },
        ),
    })
    const wrapper = await mountDashboard()

    await wrapper.get('[data-test="composer-input"]').setValue('I want to learn about running')
    await wrapper.get('[data-test="composer-send"]').trigger('click')
    await flushPromises()

    const input = wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement
    expect(input.value).toBe('I want to learn about running')
    expect(wrapper.get('[data-test="form-error"]').text()).toBe(
      'The tutor can’t answer right now. Try again in a moment.',
    )
    expect(wrapper.find('[data-test="pending-message"]').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('lets you pick up your latest conversation that isn’t saved yet', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([
        makeSummary({ id: 7, title: 'Photosynthesis', is_saved: true }),
        makeSummary({ id: 10, title: 'Biomechanics of running' }),
      ]),
    })

    const wrapper = await mountDashboard()

    const resume = wrapper.get('[data-test="resume-session"]')
    expect(resume.text()).toContain('Biomechanics of running')
    expect(resume.get('a').attributes('href')).toBe('/conversations/10')
  })

  it('logs you out from the sidebar', async () => {
    const fetchMock = stubApi({
      'GET /user': Response.json(user),
      'GET /topics': Response.json([]),
      'GET /conversations': Response.json([]),
      'POST /auth/logout': () => new Response(null, { status: 204 }),
    })
    const wrapper = await mountDashboard()

    await wrapper.get('[data-test="logout"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenLastCalledWith(
      `${import.meta.env.VITE_API_URL}/auth/logout`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(useAuthStore().isAuthenticated).toBe(false)
  })
})
