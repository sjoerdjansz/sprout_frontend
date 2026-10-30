import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ThemeToggle from '../ThemeToggle.vue'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('switches between light and dark mode', async () => {
    localStorage.setItem('sprout.theme', 'light')
    const wrapper = mount(ThemeToggle)
    const toggle = wrapper.get('[data-test="theme-toggle"]')

    expect(toggle.attributes('aria-label')).toBe('Switch to dark mode')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-label')).toBe('Switch to light mode')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
