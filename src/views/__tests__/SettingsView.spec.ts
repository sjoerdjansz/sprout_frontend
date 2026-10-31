import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { mountSettings } from '@/__tests__/mountSettings'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { useAuthStore } from '@/stores/auth'

describe('SettingsView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens on your profile, with the menu marking where you are', async () => {
    const { wrapper } = await mountSettings('/settings')

    expect(router.currentRoute.value.name).toBe('settings-profile')
    expect(wrapper.get('h1').text()).toBe('Settings')
    expect(wrapper.get('[data-test="settings-section-profile"]').attributes('aria-current')).toBe(
      'page',
    )
  })

  it('loads your settings once for the shell and the page together', async () => {
    const { fetchMock } = await mountSettings('/settings/profile')

    const settingsCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).endsWith('/settings'),
    )
    expect(settingsCalls).toHaveLength(1)
  })

  it('says what to do when your settings can’t load, and tries again', async () => {
    const { wrapper } = await mountSettings('/settings/profile', {
      'GET /settings': [
        () => Response.json({ message: 'Something went wrong.' }, { status: 500 }),
        () => Response.json(makeSettings()),
      ],
    })

    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Something went wrong.')

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="name"]').exists()).toBe(true)
  })

  it('logs you out from the menu', async () => {
    const { wrapper } = await mountSettings('/settings/profile', {
      'POST /auth/logout': new Response(null, { status: 204 }),
    })

    await wrapper.get('[data-test="settings-logout"]').trigger('click')
    await flushPromises()

    expect(useAuthStore().isAuthenticated).toBe(false)
  })
})
