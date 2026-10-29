import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ResendLink from '../ResendLink.vue'

describe('ResendLink', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down before you can resend the link', async () => {
    const wrapper = mount(ResendLink)

    expect(wrapper.get('[data-test="resend"]').text()).toBe('Resend in 0:45')
    expect(wrapper.get('[data-test="resend"]').attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(36_000)
    expect(wrapper.get('[data-test="resend"]').text()).toBe('Resend in 0:09')

    await vi.advanceTimersByTimeAsync(9_000)
    expect(wrapper.get('[data-test="resend"]').text()).toBe('Resend link')
    expect(wrapper.get('[data-test="resend"]').attributes('disabled')).toBeUndefined()
  })

  it('reports a resend and starts counting down again', async () => {
    const wrapper = mount(ResendLink)
    await vi.advanceTimersByTimeAsync(45_000)

    await wrapper.get('[data-test="resend"]').trigger('click')

    expect(wrapper.emitted('resend')).toHaveLength(1)
    expect(wrapper.get('[data-test="resend"]').text()).toBe('Resend in 0:45')
  })

  it('shows whether the resend went through', async () => {
    const wrapper = mount(ResendLink, { props: { sent: true } })
    expect(wrapper.text()).toContain('New link on its way')

    await wrapper.setProps({ sent: false, error: 'Wait a minute and try again.' })
    expect(wrapper.text()).not.toContain('New link on its way')
    expect(wrapper.get('[data-test="form-error"]').text()).toBe('Wait a minute and try again.')
  })
})
