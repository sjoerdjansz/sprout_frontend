import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

// index.html reads the same key before the app loads, so the page never flashes the wrong theme.
const themeKey = 'sprout.theme'

export type Theme = 'light' | 'dark'

/** Your saved choice, otherwise your system setting. Keep in sync with the script in index.html. */
function initialTheme(): Theme {
  const savedTheme = localStorage.getItem(themeKey)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(initialTheme())

  function toggleTheme(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(themeKey, theme.value)
  }

  // main.css switches the colour tokens on this attribute.
  watch(
    theme,
    (currentTheme) => {
      document.documentElement.dataset.theme = currentTheme
    },
    { immediate: true },
  )

  return { theme, toggleTheme }
})
