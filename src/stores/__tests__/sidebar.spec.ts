import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSidebarStore } from '@/stores/sidebar'

describe('sidebar store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts expanded', () => {
    expect(useSidebarStore().collapsed).toBe(false)
  })

  it('remembers that you collapsed it, also after a reload', () => {
    useSidebarStore().toggleCollapsed()
    expect(localStorage.getItem('sprout.sidebarCollapsed')).toBe('true')

    setActivePinia(createPinia())
    expect(useSidebarStore().collapsed).toBe(true)
  })
})
