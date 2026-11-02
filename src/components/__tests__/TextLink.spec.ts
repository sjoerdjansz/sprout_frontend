import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TextLink from '../TextLink.vue'

describe('TextLink', () => {
  it('is primary by default', () => {
    const wrapper = mount(TextLink, { slots: { default: 'Continue' } })

    expect(wrapper.get('a').classes()).toContain('text-primary')
  })

  it('turns light on a primary ground', () => {
    const wrapper = mount(TextLink, {
      props: { tone: 'on-primary' },
      slots: { default: 'Continue' },
    })

    const classes = wrapper.get('a').classes()
    expect(classes).toContain('text-on-primary')
    expect(classes).not.toContain('text-primary')
  })
})
