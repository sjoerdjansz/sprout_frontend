import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { useSettingsStore } from '../settings'
import { useThemeStore } from '../theme'

type ChangeListener = (event: MediaQueryListEvent) => void

/** Stubs the system's colour scheme; returns a way to change it while the app runs. */
function stubSystemTheme(prefersDark: boolean): (nowDark: boolean) => void {
  let listener: ChangeListener | undefined
  vi.stubGlobal(
    'matchMedia',
    vi.fn<typeof window.matchMedia>().mockReturnValue({
      matches: prefersDark,
      addEventListener: (_type: string, callback: ChangeListener) => {
        listener = callback
      },
    } as unknown as MediaQueryList),
  )

  return (nowDark) => listener?.({ matches: nowDark } as MediaQueryListEvent)
}

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    delete document.documentElement.dataset.reduceMotion
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('follows your system until your settings say otherwise', () => {
    stubSystemTheme(true)

    expect(useThemeStore().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('starts from the choice cached on this device', () => {
    stubSystemTheme(true)
    localStorage.setItem('sprout.theme', 'light')

    expect(useThemeStore().theme).toBe('light')
  })

  it('applies the theme from your settings and caches it for the next visit', async () => {
    stubSystemTheme(false)
    const themeStore = useThemeStore()

    useSettingsStore().settings = makeSettings({ theme: 'dark' })
    await nextTick()

    expect(themeStore.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('sprout.theme')).toBe('dark')
  })

  it('keeps following the system when you pick Match system', async () => {
    const changeSystem = stubSystemTheme(false)
    const themeStore = useThemeStore()
    useSettingsStore().settings = makeSettings({ theme: 'system' })
    await nextTick()

    changeSystem(true)
    await nextTick()

    expect(themeStore.theme).toBe('dark')
  })

  it('marks the page when you reduce motion', async () => {
    stubSystemTheme(false)
    useThemeStore()
    const settingsStore = useSettingsStore()

    settingsStore.settings = makeSettings({ reduce_motion: true })
    await nextTick()
    expect(document.documentElement.dataset.reduceMotion).toBe('')

    settingsStore.settings = makeSettings({ reduce_motion: false })
    await nextTick()
    expect(document.documentElement.dataset.reduceMotion).toBeUndefined()
  })
})
