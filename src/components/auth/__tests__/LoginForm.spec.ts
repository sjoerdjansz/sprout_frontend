import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '../LoginForm.vue'

describe('LoginForm', () => {
  it('submits the trimmed email', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.get('[data-test="email"]').setValue(' ada@example.com ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([['ada@example.com']])
  })

  it('tells you what to do instead of submitting an invalid email', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.get('[data-test="email"]').setValue('ada')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('That doesn’t look like an email address.')
    expect(wrapper.get('[data-test="email"]').attributes('aria-invalid')).toBe('true')
  })
})
