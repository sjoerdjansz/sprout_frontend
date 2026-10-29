import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import CheckEmailView from '../CheckEmailView.vue'

async function routerAt(path: string): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/check-email', name: 'check-email', component: CheckEmailView },
      { path: '/login', name: 'login', component: CheckEmailView },
    ],
  })
  await router.push(path)

  return router
}

describe('CheckEmailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows where the magic link went', async () => {
    const router = await routerAt('/check-email?email=ada%40example.com')
    const wrapper = mount(CheckEmailView, { global: { plugins: [router] } })

    expect(wrapper.get('[data-test="sent-to"]').text()).toContain(
      'We sent a magic link to ada@example.com.',
    )
  })

  it('still reads well without an email in the URL, and has nothing to resend to', async () => {
    const router = await routerAt('/check-email')
    const wrapper = mount(CheckEmailView, { global: { plugins: [router] } })

    expect(wrapper.get('[data-test="sent-to"]').text()).toContain(
      'We sent a magic link to your email.',
    )
    expect(wrapper.find('[data-test="resend"]').exists()).toBe(false)
  })

  it('resends the link to the same email', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: 'Check your inbox.' }, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const router = await routerAt('/check-email?email=ada%40example.com')
    const wrapper = mount(CheckEmailView, { global: { plugins: [router] } })
    await vi.advanceTimersByTimeAsync(45_000)

    await wrapper.get('[data-test="resend"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'ada@example.com' }),
      }),
    )
    expect(wrapper.text()).toContain('New link on its way')
  })
})
