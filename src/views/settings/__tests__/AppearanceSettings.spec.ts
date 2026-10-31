import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { bodyOf, mountSettings } from '@/__tests__/mountSettings'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

describe('AppearanceSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.reduceMotion
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
    // App.vue starts the theme store; these tests mount below it.
    useThemeStore()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('switches to dark at once and saves it', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/appearance', {
      'PATCH /settings': Response.json(makeSettings({ theme: 'dark' })),
    })
    expect(wrapper.get('[data-test="theme-system"]').attributes('aria-pressed')).toBe('true')

    await wrapper.get('[data-test="theme-dark"]').trigger('click')
    await flushPromises()

    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({ theme: 'dark' })
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(wrapper.get('[data-test="theme-dark"]').attributes('aria-pressed')).toBe('true')
  })

  it('goes back to the old theme when saving fails', async () => {
    const { wrapper } = await mountSettings('/settings/appearance', {
      'GET /settings': Response.json(makeSettings({ theme: 'light' })),
      'PATCH /settings': Response.json({ message: 'Something went wrong.' }, { status: 500 }),
    })

    await wrapper.get('[data-test="theme-dark"]').trigger('click')
    await flushPromises()

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Something went wrong.')
  })

  it('reduces motion across the app', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/appearance', {
      'PATCH /settings': Response.json(makeSettings({ reduce_motion: true })),
    })

    await wrapper.get('[data-test="reduce-motion"] [role="switch"]').trigger('click')
    await flushPromises()

    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({ reduce_motion: true })
    expect(document.documentElement.dataset.reduceMotion).toBe('')
  })
})
