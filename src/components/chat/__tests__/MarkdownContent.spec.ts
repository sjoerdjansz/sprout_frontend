import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkdownContent from '../MarkdownContent.vue'

describe('MarkdownContent', () => {
  it('renders bold text and lists', () => {
    const wrapper = mount(MarkdownContent, {
      props: { source: 'What draws you to it?\n\n- **sport**\n- injuries' },
    })

    expect(wrapper.find('strong').text()).toBe('sport')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('shows HTML as text instead of running it', () => {
    const wrapper = mount(MarkdownContent, {
      props: { source: '<script>alert(1)</script> <img src=x onerror=alert(1)>' },
    })

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<script>alert(1)</script>')
  })

  it('drops javascript links', () => {
    const wrapper = mount(MarkdownContent, { props: { source: '[click](javascript:alert(1))' } })

    expect(wrapper.find('a').exists()).toBe(false)
  })
})
