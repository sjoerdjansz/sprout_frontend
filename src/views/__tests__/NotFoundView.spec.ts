import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import NotFoundView from '../NotFoundView.vue'

describe('NotFoundView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('catches a URL the app does not know and keeps it in the address bar', async () => {
    await router.push('/topics/does-not-exist?tab=cards')

    expect(router.currentRoute.value.name).toBe('not-found')
    expect(router.currentRoute.value.fullPath).toBe('/topics/does-not-exist?tab=cards')
  })

  it('shows the page to signed out visitors too, instead of sending them to log in', async () => {
    await router.push('/nowhere')

    expect(router.currentRoute.value.name).toBe('not-found')
  })

  it('tells you what happened and links back home and to your library', async () => {
    await router.push('/nowhere')
    const wrapper = mount(NotFoundView, { global: { plugins: [router] } })

    expect(wrapper.get('[data-test="not-found-title"]').text()).toBe('Oops. A little lost.')
    expect(wrapper.get('[data-test="home-link"]').attributes('href')).toBe('/')
    expect(wrapper.get('[data-test="library-link"]').attributes('href')).toBe('/topics')
  })
})
