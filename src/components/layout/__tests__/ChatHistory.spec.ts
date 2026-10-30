import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import router from '@/router'
import { makeSummary } from '@/__tests__/conversationFixtures'
import ChatHistory from '../ChatHistory.vue'

describe('ChatHistory', () => {
  it('lists your conversations and marks the saved ones', () => {
    const wrapper = mount(ChatHistory, {
      props: {
        conversations: [
          makeSummary({ id: 10, title: null }),
          makeSummary({ id: 7, title: 'Photosynthesis', is_saved: true }),
        ],
      },
      global: { plugins: [router] },
    })

    const items = wrapper.findAll('[data-test="history-item"]')
    expect(items.map((item) => item.text())).toEqual(['New conversation', 'Photosynthesis(saved)'])
    expect(items[1]?.attributes('href')).toBe('/conversations/7')
  })

  it('says how to start when there are no conversations yet', () => {
    const wrapper = mount(ChatHistory, {
      props: { conversations: [] },
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('No chats yet. Ask the tutor something on your dashboard.')
  })
})
