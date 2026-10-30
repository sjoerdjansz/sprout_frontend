import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatComposer from '../ChatComposer.vue'

function mountComposer(props: Record<string, unknown> = {}): ReturnType<typeof mount> {
  const wrapper = mount(ChatComposer, {
    props: {
      modelValue: '',
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      ...props,
    },
    attachTo: document.body,
  })

  return wrapper
}

describe('ChatComposer', () => {
  it('sends the trimmed message on Enter', async () => {
    const wrapper = mountComposer()
    const input = wrapper.get('[data-test="composer-input"]')

    await input.setValue('  What is recursion?  ')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('send')).toEqual([['What is recursion?']])
  })

  it('keeps typing on Shift+Enter', async () => {
    const wrapper = mountComposer()
    const input = wrapper.get('[data-test="composer-input"]')

    await input.setValue('First line')
    await input.trigger('keydown.enter', { shiftKey: true })

    expect(wrapper.emitted('send')).toBeUndefined()
  })

  it('only lets you send once there is something to send', async () => {
    const wrapper = mountComposer()
    const send = wrapper.get('[data-test="composer-send"]')

    expect(send.attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="composer-input"]').setValue('Quiz me')
    expect(send.attributes('disabled')).toBeUndefined()

    await send.trigger('click')
    expect(wrapper.emitted('send')).toEqual([['Quiz me']])
  })

  it('does not send while the tutor is answering', async () => {
    const wrapper = mountComposer({ modelValue: 'Next question', disabled: true })

    await wrapper.get('[data-test="composer-input"]').trigger('keydown.enter')

    expect(wrapper.get('[data-test="composer-send"]').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('send')).toBeUndefined()
  })

  it('starts your message from a suggestion and puts the cursor in the box', async () => {
    const wrapper = mountComposer({
      suggestions: [
        { label: 'Learn something new', icon: 'sparkles', message: 'I want to learn about ' },
      ],
    })

    await wrapper.get('[data-test="suggestion"]').trigger('click')

    const input = wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement
    expect(input.value).toBe('I want to learn about ')
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })
})
