import { beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import AppSidebar from '../AppSidebar.vue'

function mountSidebar(collapsed: boolean): VueWrapper {
  return mount(AppSidebar, {
    props: { userName: 'Ada Lovelace', userInitials: 'AL', conversations: [], collapsed },
    global: { plugins: [router] },
  })
}

describe('AppSidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows who is signed in, then log out at the bottom', () => {
    const wrapper = mountSidebar(false)

    expect(wrapper.get('[data-test="account"]').text()).toContain('Ada Lovelace')
    expect(wrapper.get('[data-test="logout"]').text()).toBe('Log out')

    const bottom = wrapper.findAll('[data-test]').map((element) => element.attributes('data-test'))
    expect(bottom.slice(-2)).toEqual(['account', 'logout'])
  })

  it('logs you out and asks to collapse', async () => {
    const wrapper = mountSidebar(false)

    await wrapper.get('[data-test="logout"]').trigger('click')
    await wrapper.get('[data-test="sidebar-toggle"]').trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
    expect(wrapper.emitted('toggleCollapsed')).toHaveLength(1)
  })

  it('collapsed, keeps only icons with their names as tooltips', () => {
    const wrapper = mountSidebar(true)

    expect(wrapper.find('[data-test="chat-history"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="sidebar-toggle"]').attributes()).toMatchObject({
      'aria-label': 'Expand sidebar',
      'aria-expanded': 'false',
    })
    expect(wrapper.get('a[href="/knowledge-map"]').attributes('title')).toBe('Knowledge map')
    expect(wrapper.get('a[href="/practice"]').attributes('title')).toBe('Practice center')
    expect(wrapper.get('[data-test="logout"]').attributes('title')).toBe('Log out')
  })
})
