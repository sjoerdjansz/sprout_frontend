import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeSummary } from '@/__tests__/conversationFixtures'
import MobileDrawer from '../MobileDrawer.vue'

function mountDrawer(historyError: string | null = null): VueWrapper {
  return mount(MobileDrawer, {
    props: {
      userName: 'Ada Lovelace',
      userInitials: 'AL',
      conversations: [makeSummary()],
      historyError,
    },
    global: { plugins: [router] },
  })
}

describe('MobileDrawer', () => {
  beforeAll(() => {
    // jsdom doesn't implement modal dialogs.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
  })

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows who is signed in, where you can go and your chats', () => {
    const wrapper = mountDrawer()

    expect(wrapper.get('[data-test="account"]').text()).toContain('Ada Lovelace')
    const links = wrapper.findAll('[data-test="drawer-link"]')
    expect(links).toHaveLength(5)
    expect(links[0]?.text()).toContain('Dashboard')
    expect(links[0]?.text()).toContain('Chat, today’s queue, progress')
    // There's no AI key to manage any more (the artboard still says so).
    expect(links[4]?.text()).toContain('Profile, effort, reminders, appearance')
    expect(wrapper.get('[data-test="history-item"]').text()).toBe('Biomechanics of running')
  })

  it('says why your chats couldn’t load', () => {
    const wrapper = mountDrawer(
      'Can’t reach Sprout right now. Check your connection and try again.',
    )

    expect(wrapper.get('[data-test="history-error"]').text()).toBe(
      'Can’t reach Sprout right now. Check your connection and try again.',
    )
  })

  it('closes with its button, Escape and a click next to it', async () => {
    const wrapper = mountDrawer()

    await wrapper.get('[data-test="close-menu"]').trigger('click')
    await wrapper.get('dialog').trigger('cancel')
    await wrapper.get('dialog').trigger('click')
    // A click inside the drawer keeps it open.
    await wrapper.get('[data-test="account"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(3)
  })

  it('logs you out', async () => {
    const wrapper = mountDrawer()

    await wrapper.get('[data-test="logout"]').trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
  })
})
