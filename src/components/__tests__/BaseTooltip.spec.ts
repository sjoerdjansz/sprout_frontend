import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import BaseTooltip from '../BaseTooltip.vue'

function mountTooltip(): VueWrapper {
  return mount(BaseTooltip, {
    props: { text: 'Quiz: holding over time' },
    slots: { default: '<span>icon</span>' },
  })
}

describe('BaseTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows after resting the mouse on it for half a second', async () => {
    const wrapper = mountTooltip()

    await wrapper.trigger('pointerenter', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(499)
    expect(wrapper.find('[data-test="tooltip"]').exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.get('[data-test="tooltip"]').text()).toBe('Quiz: holding over time')
  })

  it('hides when the mouse leaves', async () => {
    const wrapper = mountTooltip()

    await wrapper.trigger('pointerenter', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(500)
    await wrapper.trigger('pointerleave')

    expect(wrapper.find('[data-test="tooltip"]').exists()).toBe(false)
  })

  it('doesn’t show when the mouse leaves before the delay', async () => {
    const wrapper = mountTooltip()

    await wrapper.trigger('pointerenter', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(250)
    await wrapper.trigger('pointerleave')
    await vi.advanceTimersByTimeAsync(500)

    expect(wrapper.find('[data-test="tooltip"]').exists()).toBe(false)
  })

  it('doesn’t show on touch', async () => {
    const wrapper = mountTooltip()

    await wrapper.trigger('pointerenter', { pointerType: 'touch' })
    await vi.advanceTimersByTimeAsync(500)

    expect(wrapper.find('[data-test="tooltip"]').exists()).toBe(false)
  })
})
