import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SignUpForm from '../SignUpForm.vue'

describe('SignUpForm', () => {
  it('submits the details with the picked interests and reminder choice', async () => {
    const wrapper = mount(SignUpForm)

    await wrapper.get('[data-test="name"]').setValue(' Ada ')
    await wrapper.get('[data-test="email"]').setValue('ada@example.com')
    await wrapper.get('[data-test="interest-science"]').trigger('click')
    await wrapper.get('[data-test="interest-maths"]').trigger('click')
    await wrapper.get('[data-test="interest-science"]').trigger('click')
    await wrapper.get('[role="switch"]').trigger('click')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[data-test="interest-maths"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Ada',
          email: 'ada@example.com',
          interests: ['maths'],
          wants_daily_reminder: false,
        },
      ],
    ])
  })

  it('asks for a name and an email before submitting', async () => {
    const wrapper = mount(SignUpForm)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Tell us what to call you.')
    expect(wrapper.text()).toContain('Enter your email address.')
  })
})
