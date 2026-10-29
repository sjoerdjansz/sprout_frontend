import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
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

describe('DashboardView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('greets you by first name and shows your initials', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(user))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/user`,
      expect.objectContaining({ method: 'GET' }),
    )
    expect(wrapper.get('h1').text()).toMatch(/^Good (morning|afternoon|evening), Ada$/)
    expect(wrapper.get('[data-test="logout"]').text()).toContain('AL')
  })

  it('shows every section of the dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json(user)))

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    const headings = wrapper.findAll('h2').map((heading) => heading.text())
    expect(headings).toEqual([
      'What do you want to understand today?',
      'Today’s retention queue',
      'Start a practice session',
      'This week',
    ])
  })

  it('logs you out from the sidebar', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(user))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.get('[data-test="logout"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenLastCalledWith(
      `${import.meta.env.VITE_API_URL}/auth/logout`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(useAuthStore().isAuthenticated).toBe(false)
  })
})
