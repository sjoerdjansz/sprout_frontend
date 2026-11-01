import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeMaterial } from '@/__tests__/conversationFixtures'
import ChatMessage from '../ChatMessage.vue'

describe('ChatMessage', () => {
  it('shows the files you sent as chips with their name and size', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        from: 'user',
        materials: [
          makeMaterial(),
          makeMaterial({ id: 8, original_filename: 'notes.md', size_bytes: 900 }),
        ],
      },
      slots: { default: 'Here are my notes' },
    })

    const chips = wrapper.findAll('[data-test="attachment-chip"]')
    expect(chips.map((chip) => chip.get('[data-test="attachment-name"]').text())).toEqual([
      'Lecture 1.pdf',
      'notes.md',
    ])
    expect(chips[0]?.text()).toContain('471 KB')
    // Sent files can't be removed or downloaded.
    expect(wrapper.find('[data-test="remove-attachment"]').exists()).toBe(false)
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('shows no files on a tutor message, nor on one without them', () => {
    const tutor = mount(ChatMessage, {
      props: { from: 'tutor', materials: [makeMaterial()] },
      slots: { default: 'Great choice!' },
    })
    const withoutFiles = mount(ChatMessage, {
      props: { from: 'user' },
      slots: { default: 'Hello' },
    })

    expect(tutor.find('[data-test="message-files"]').exists()).toBe(false)
    expect(withoutFiles.find('[data-test="message-files"]').exists()).toBe(false)
  })
})
