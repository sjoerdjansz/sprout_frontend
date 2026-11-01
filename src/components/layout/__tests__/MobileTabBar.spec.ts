import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import MobileTabBar from '../MobileTabBar.vue'

describe('MobileTabBar', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    // The topics page is only for signed-in users.
    useAuthStore().setToken('1|abc')
  })

  it('links to the main pages and marks the one you’re on', async () => {
    await router.push('/topics')
    const wrapper = mount(MobileTabBar, { global: { plugins: [router] } })
    await flushPromises()

    const tabs = wrapper.findAll('[data-test="tab"]')
    expect(tabs.map((tab) => tab.text())).toEqual(['Home', 'Topics', 'Practice', 'Insights'])
    expect(tabs.map((tab) => tab.attributes('href'))).toEqual(['/', '/topics', '/practice', '#'])
    expect(tabs[1]?.attributes('aria-current')).toBe('page')
    expect(tabs[0]?.attributes('aria-current')).toBeUndefined()
  })

  it('asks for the menu with More', async () => {
    const wrapper = mount(MobileTabBar, { global: { plugins: [router] } })

    await wrapper.get('[data-test="tab-more"]').trigger('click')

    expect(wrapper.emitted('more')).toHaveLength(1)
  })
})
