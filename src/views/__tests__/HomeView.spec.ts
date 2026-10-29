import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '../HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows that the API is connected', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 'ok' }))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(HomeView)
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/status`,
      expect.objectContaining({ method: 'GET' }),
    )
    expect(wrapper.get('[data-test="connection"]').text()).toContain('Connected to the Sprout API.')
  })

  it('tells you what to do when the API is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    const wrapper = mount(HomeView)
    await flushPromises()

    expect(wrapper.text()).toContain("Can't reach the Sprout API.")
    expect(wrapper.get('[data-test="retry"]').text()).toBe('Try again')
  })
})
