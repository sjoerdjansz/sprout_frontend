import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '../theme'

function stubSystemTheme(prefersDark: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn<typeof window.matchMedia>().mockReturnValue({ matches: prefersDark } as MediaQueryList),
  )
}

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('follows your system setting when you have not chosen yet', () => {
    stubSystemTheme(true)

    const themeStore = useThemeStore()

    expect(themeStore.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('prefers the theme you chose over your system setting', () => {
    stubSystemTheme(true)
    localStorage.setItem('sprout.theme', 'light')

    expect(useThemeStore().theme).toBe('light')
  })

  it('toggles the theme and remembers your choice', async () => {
    stubSystemTheme(false)
    const themeStore = useThemeStore()

    themeStore.toggleTheme()
    // The attribute is set by a watcher, which runs before the next render.
    await Promise.resolve()

    expect(themeStore.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('sprout.theme')).toBe('dark')
  })
})
