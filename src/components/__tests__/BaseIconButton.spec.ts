import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseIconButton from '../BaseIconButton.vue'

describe('BaseIconButton', () => {
  it('names the button for screen readers and as a tooltip', () => {
    const wrapper = mount(BaseIconButton, { props: { icon: 'bell', label: 'Notifications' } })

    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe('Notifications')
    expect(button.attributes('title')).toBe('Notifications')
    expect(button.attributes('type')).toBe('button')
  })
})
