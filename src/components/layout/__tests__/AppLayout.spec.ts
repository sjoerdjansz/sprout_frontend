import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { stubApi } from '@/__tests__/stubApi'
import { useAuthStore, type User } from '@/stores/auth'
import AppLayout from '../AppLayout.vue'

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  pending_email: null,
  email_verified_at: '2026-10-29T12:00:00.000000Z',
  avatar_color: 'sun',
  interests: [],
  wants_daily_reminder: true,
  created_at: '2026-10-29T12:00:00.000000Z',
}

async function mountLayout(props: { tabBar?: boolean } = {}): Promise<VueWrapper> {
  await router.push('/')
  const wrapper = mount(AppLayout, { props, global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

describe('AppLayout', () => {
  beforeAll(() => {
    // jsdom doesn't implement modal dialogs.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
  })

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
    stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([]),
      'GET /settings': Response.json({ message: 'Not needed here.' }, { status: 500 }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the menu from the top bar and from More, and closes it on another page', async () => {
    const wrapper = await mountLayout()
    expect(wrapper.find('[data-test="drawer"]').exists()).toBe(false)

    await wrapper.get('[data-test="open-menu"]').trigger('click')
    expect(wrapper.find('[data-test="drawer"]').exists()).toBe(true)

    await wrapper.get('[data-test="close-menu"]').trigger('click')
    await wrapper.get('[data-test="tab-more"]').trigger('click')
    expect(wrapper.find('[data-test="drawer"]').exists()).toBe(true)

    await router.push('/practice')
    await flushPromises()
    expect(wrapper.find('[data-test="drawer"]').exists()).toBe(false)
  })

  it('leaves out the tab bar when the page asks', async () => {
    expect((await mountLayout()).find('[data-test="tab-bar"]').exists()).toBe(true)
    expect((await mountLayout({ tabBar: false })).find('[data-test="tab-bar"]').exists()).toBe(
      false,
    )
  })
})
