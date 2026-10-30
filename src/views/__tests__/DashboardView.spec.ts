import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeConversation, makeSummary } from '@/__tests__/conversationFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { useAuthStore, type User } from '@/stores/auth'
import DashboardView from '../DashboardView.vue'

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  email_verified_at: '2026-10-29T12:00:00.000000Z',
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
    stubApi({ 'GET /user': Response.json(user), 'GET /conversations': Response.json([]) })

    const wrapper = await mountDashboard()

    expect(wrapper.get('h1').text()).toMatch(/^Good (morning|afternoon|evening), Ada$/)
    expect(wrapper.get('[data-test="account"]').text()).toContain('AL')
    expect(wrapper.get('[data-test="account"]').text()).toContain('Ada Lovelace')
  })

  it('shows every section of the dashboard', async () => {
    stubApi({ 'GET /user': Response.json(user), 'GET /conversations': Response.json([]) })

    const wrapper = await mountDashboard()

    const headings = wrapper.findAll('main h2').map((heading) => heading.text())
    expect(headings).toEqual([
      'What do you want to understand today?',
      'Today’s retention queue',
      'Start a practice session',
    ])
  })

  it('offers the same four ways to practise as the knowledge map', async () => {
    stubApi({ 'GET /user': Response.json(user), 'GET /conversations': Response.json([]) })

    const wrapper = await mountDashboard()

    const practice = wrapper.get('[aria-labelledby="practice-heading"]')
    expect(
      practice.findAll('button').map((card) => card.find('span:nth-of-type(2)').text()),
    ).toEqual(['Flashcards', 'Retrieval quiz', 'Explain it', 'Open session'])
  })

  it('starts a conversation with your first message and opens it', async () => {
    let answerTutor: (response: Response) => void = () => {}
    const fetchMock = stubApi({
      'GET /user': Response.json(user),
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

  it('gives your message back when the tutor can’t answer', async () => {
    stubApi({
      'GET /user': Response.json(user),
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
