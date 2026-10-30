import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTabs from '../BaseTabs.vue'

const items = [
  { id: 'cards', label: 'Flashcards', count: 8 },
  { id: 'questions', label: 'Questions', count: 3 },
  { id: 'sessions', label: 'Sessions' },
]

function mountTabs(modelValue = 'cards') {
  return mount(BaseTabs, {
    attachTo: document.body,
    props: {
      items,
      label: 'Materials',
      modelValue,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
  })
}

let wrapper: ReturnType<typeof mountTabs>

describe('BaseTabs', () => {
  it('marks the selected tab and shows counts', () => {
    wrapper = mountTabs()

    expect(wrapper.get('[data-test="tab-cards"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="tab-questions"]').attributes('tabindex')).toBe('-1')
    expect(wrapper.findAll('[data-test="tab-count"]').map((count) => count.text())).toEqual([
      '8',
      '3',
    ])
  })

  it('selects a tab on click and moves with the arrow keys, wrapping around', async () => {
    wrapper = mountTabs()

    await wrapper.get('[data-test="tab-questions"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['questions'])

    await wrapper.get('[data-test="tab-questions"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['sessions'])
    expect(document.activeElement).toBe(wrapper.get('[data-test="tab-sessions"]').element)

    await wrapper.get('[data-test="tab-sessions"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual(['cards'])

    wrapper.unmount()
  })
})
