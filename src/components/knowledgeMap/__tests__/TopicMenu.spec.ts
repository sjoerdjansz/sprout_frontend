import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import TopicMenu from '../TopicMenu.vue'

let wrapper: VueWrapper | null = null

function mountMenu(): VueWrapper {
  wrapper = mount(TopicMenu, { props: { topicTitle: 'Biology' }, attachTo: document.body })

  return wrapper
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('TopicMenu', () => {
  it('opens on the button and reports Edit topic', async () => {
    const menu = mountMenu()

    await menu.get('[data-test="topic-menu"]').trigger('click')
    await menu.get('[data-test="topic-menu-edit"]').trigger('click')

    expect(menu.emitted('edit')).toHaveLength(1)
    expect(menu.find('[role="menu"]').exists()).toBe(false)
  })

  it('reports Delete topic', async () => {
    const menu = mountMenu()

    await menu.get('[data-test="topic-menu"]').trigger('click')
    await menu.get('[data-test="topic-menu-delete"]').trigger('click')

    expect(menu.emitted('delete')).toHaveLength(1)
    expect(menu.emitted('edit')).toBeUndefined()
    expect(menu.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes on Escape', async () => {
    const menu = mountMenu()

    await menu.get('[data-test="topic-menu"]').trigger('click')
    await menu.get('[role="menu"]').trigger('keydown', { key: 'Escape' })

    expect(menu.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes on a click outside it', async () => {
    const menu = mountMenu()

    await menu.get('[data-test="topic-menu"]').trigger('click')
    document.body.click()
    await menu.vm.$nextTick()

    expect(menu.find('[role="menu"]').exists()).toBe(false)
    expect(menu.emitted('edit')).toBeUndefined()
  })
})
