import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { makeUser } from '@/__tests__/settingsFixtures'
import { bodyOf } from '@/__tests__/mountSettings'
import { stubApi } from '@/__tests__/stubApi'
import { useAuthStore } from '@/stores/auth'
import EmailConfirmView from '../EmailConfirmView.vue'

async function routerAt(path: string): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: EmailConfirmView },
      { path: '/settings/profile', name: 'settings-profile', component: EmailConfirmView },
      {
        path: '/settings/email/confirm',
        name: 'settings-email-confirm',
        component: EmailConfirmView,
      },
    ],
  })
  await router.push(path)

  return router
}

describe('EmailConfirmView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('confirms the new email with the token from the link', async () => {
    const fetchMock = stubApi({
      'POST /user/email/confirm': Response.json(makeUser({ email: 'ada@new.example' })),
    })
    const auth = useAuthStore()
    auth.setToken('1|abc')
    auth.user = makeUser({ pending_email: 'ada@new.example' })
    const router = await routerAt('/settings/email/confirm?token=change')

    const wrapper = mount(EmailConfirmView, { global: { plugins: [router] } })
    expect(wrapper.get('[data-test="status"]').text()).toBe('Confirming your email…')
    await flushPromises()

    expect(bodyOf(fetchMock, 'POST /user/email/confirm')).toEqual({ token: 'change' })
    expect(wrapper.get('[data-test="confirmed"]').text()).toContain('ada@new.example')
    expect(auth.user?.email).toBe('ada@new.example')
    expect(wrapper.get('[data-test="next"]').attributes('href')).toBe('/settings/profile')
  })

  it('sends you to log in when this device isn’t signed in', async () => {
    stubApi({ 'POST /user/email/confirm': Response.json(makeUser({ email: 'ada@new.example' })) })
    const router = await routerAt('/settings/email/confirm?token=change')

    const wrapper = mount(EmailConfirmView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('[data-test="next"]').attributes('href')).toBe('/login')
  })

  it('says why a used link doesn’t work', async () => {
    const message =
      'This link has expired or was already used. Change your email again from your settings.'
    stubApi({
      'POST /user/email/confirm': Response.json(
        { message, errors: { token: [message] } },
        { status: 422 },
      ),
    })
    const router = await routerAt('/settings/email/confirm?token=used')

    const wrapper = mount(EmailConfirmView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('[data-test="error"]').text()).toBe(message)
  })
})
