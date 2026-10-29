import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatComposer from '../ChatComposer.vue'

describe('ChatComposer', () => {
  it('sends the trimmed message on Enter and clears the box', async () => {
    const wrapper = mount(ChatComposer)
    const input = wrapper.get('[data-test="composer-input"]')

    await input.setValue('  What is recursion?  ')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('send')).toEqual([['What is recursion?']])
    expect((input.element as HTMLTextAreaElement).value).toBe('')
  })

  it('keeps typing on Shift+Enter', async () => {
    const wrapper = mount(ChatComposer)
    const input = wrapper.get('[data-test="composer-input"]')

    await input.setValue('First line')
    await input.trigger('keydown.enter', { shiftKey: true })

    expect(wrapper.emitted('send')).toBeUndefined()
  })

  it('only lets you send once there is something to send', async () => {
    const wrapper = mount(ChatComposer)
    const send = wrapper.get('[data-test="composer-send"]')

    expect(send.attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="composer-input"]').setValue('Quiz me')
    expect(send.attributes('disabled')).toBeUndefined()

    await send.trigger('click')
    expect(wrapper.emitted('send')).toEqual([['Quiz me']])
  })

  it('puts a suggestion in the box', async () => {
    const wrapper = mount(ChatComposer, {
      props: { suggestions: [{ label: 'Quiz me on Spanish verbs', icon: 'list-checks' }] },
    })

    await wrapper.get('[data-test="suggestion"]').trigger('click')

    const input = wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement
    expect(input.value).toBe('Quiz me on Spanish verbs')
  })
})
