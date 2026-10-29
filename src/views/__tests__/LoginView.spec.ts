import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import LoginView from '../LoginView.vue'

function testRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/sign-up', name: 'sign-up', component: LoginView },
      { path: '/check-email', name: 'check-email', component: LoginView },
    ],
  })
}

async function submitEmail(router: Router): Promise<ReturnType<typeof mount>> {
  await router.push('/login')
  const wrapper = mount(LoginView, { global: { plugins: [router] } })
  await wrapper.get('[data-test="email"]').setValue('ada@example.com')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  return wrapper
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a magic link and moves on to the check your inbox screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ message: 'Check your inbox.' }, { status: 202 })),
    )
    const router = testRouter()

    await submitEmail(router)

    expect(router.currentRoute.value.name).toBe('check-email')
    expect(router.currentRoute.value.query.email).toBe('ada@example.com')
  })

  it('shows the API message when you asked for too many links', async () => {
    const message = "You've asked for a few links in a row. Wait a minute and try again."
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ message }, { status: 429 })),
    )
    const router = testRouter()

    const wrapper = await submitEmail(router)

    expect(router.currentRoute.value.name).toBe('login')
    expect(wrapper.get('[data-test="form-error"]').text()).toBe(message)
    expect(wrapper.get('[data-test="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('shows validation errors from the API next to the email field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json(
          {
            message: 'That email address is too long. Use a shorter one.',
            errors: { email: ['That email address is too long. Use a shorter one.'] },
          },
          { status: 422 },
        ),
      ),
    )

    const wrapper = await submitEmail(testRouter())

    expect(wrapper.get('[data-test="email"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('That email address is too long. Use a shorter one.')
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
  })
})
