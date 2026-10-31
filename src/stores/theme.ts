import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useSettingsStore, type ThemePreference } from '@/stores/settings'

// index.html reads the same key before the app loads, so the page never flashes the wrong theme.
const themeKey = 'sprout.theme'

export type Theme = 'light' | 'dark'

/** The choice from your last visit on this device, until your settings arrive from the server. */
function cachedPreference(): ThemePreference {
  const cached = localStorage.getItem(themeKey)

  return cached === 'light' || cached === 'dark' ? cached : 'system'
}

const darkQuery = '(prefers-color-scheme: dark)'

/**
 * Applies your Appearance settings to the page: the theme (light, dark, or your system's) and
 * reduce motion. It follows the settings store, so loading, changing and a failed save that
 * puts the old value back all show at once.
 */
export const useThemeStore = defineStore('theme', () => {
  const settingsStore = useSettingsStore()

  const preference = ref<ThemePreference>(cachedPreference())
  const systemIsDark = ref<boolean>(window.matchMedia?.(darkQuery).matches ?? false)
  window.matchMedia?.(darkQuery).addEventListener?.('change', (event) => {
    systemIsDark.value = event.matches
  })

  const theme = computed<Theme>(() => {
    if (preference.value === 'system') {
      return systemIsDark.value ? 'dark' : 'light'
    }

    return preference.value
  })

  watch(
    () => settingsStore.settings?.theme,
    (savedPreference) => {
      if (savedPreference === undefined) {
        return
      }
      preference.value = savedPreference
      localStorage.setItem(themeKey, savedPreference)
    },
    { immediate: true },
  )

  // main.css switches the colour tokens on this attribute.
  watch(
    theme,
    (currentTheme) => {
      document.documentElement.dataset.theme = currentTheme
    },
    { immediate: true },
  )

  // main.css makes every `motion-reduce:` class follow this attribute too, not only the system.
  watch(
    () => settingsStore.settings?.reduce_motion ?? false,
    (reduceMotion) => {
      if (reduceMotion) {
        document.documentElement.dataset.reduceMotion = ''
      } else {
        delete document.documentElement.dataset.reduceMotion
      }
    },
    { immediate: true },
  )

  return { preference, theme }
})
