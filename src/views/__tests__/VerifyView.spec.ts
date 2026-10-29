import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import VerifyView from '../VerifyView.vue'
import { useAuthStore } from '@/stores/auth'

async function routerAt(path: string): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: VerifyView },
      { path: '/login', name: 'login', component: VerifyView },
      { path: '/auth/verify', name: 'verify', component: VerifyView },
    ],
  })
  await router.push(path)

  return router
}

describe('VerifyView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('signs you in with the token from the link and goes home', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        token: '1|abc',
        user: {
          id: 1,
          name: 'Ada',
          email: 'ada@example.com',
          email_verified_at: null,
          interests: [],
          wants_daily_reminder: false,
          created_at: '2026-10-29T17:30:56.000000Z',
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const router = await routerAt('/auth/verify?token=magic')

    const wrapper = mount(VerifyView, { global: { plugins: [router] } })
    expect(wrapper.get('[data-test="status"]').text()).toBe('Signing you in…')
    await flushPromises()

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ token: 'magic' })
    expect(useAuthStore().token).toBe('1|abc')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('tells you to request a new link when this one no longer works', async () => {
    const message = 'This link has expired or was already used. Request a new one.'
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ message, errors: { token: [message] } }, { status: 422 }),
        ),
    )
    const router = await routerAt('/auth/verify?token=used')

    const wrapper = mount(VerifyView, { global: { plugins: [router] } })
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('verify')
    expect(wrapper.get('[data-test="error"]').text()).toBe(message)
    expect(wrapper.get('[data-test="request-new-link"]').attributes('href')).toBe('/login')
  })
})
