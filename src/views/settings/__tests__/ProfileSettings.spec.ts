import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { makeSettings, makeUser } from '@/__tests__/settingsFixtures'
import { useAuthStore } from '@/stores/auth'
import { bodyOf, mountSettings } from '@/__tests__/mountSettings'

async function save(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

function invalid(field: string, message: string): Response {
  return Response.json({ message, errors: { [field]: [message] } }, { status: 422 })
}

describe('ProfileSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows your name, email and role, with nothing to save yet', async () => {
    const { wrapper } = await mountSettings('/settings/profile', {
      'GET /settings': Response.json(makeSettings({ learner_role: 'student' })),
    })

    expect(wrapper.get<HTMLInputElement>('[data-test="name"]').element.value).toBe('Ada Lovelace')
    expect(wrapper.get<HTMLInputElement>('[data-test="email"]').element.value).toBe(
      'ada@example.com',
    )
    expect(wrapper.get('[data-test="role-student"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-test="role-note"]').text()).toContain('Deadline-aware.')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()
  })

  it('saves a new name, colour and role, and says so', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/profile', {
      'PATCH /user': Response.json(makeUser({ name: 'Ada' })),
      'PATCH /settings': Response.json(
        makeSettings({ avatar_color: 'sky', learner_role: 'teacher' }),
      ),
    })

    await wrapper.get('[data-test="name"]').setValue('Ada ')
    await wrapper.get('[data-test="change-color"]').trigger('click')
    await wrapper.get('[data-test="avatar-color-sky"]').trigger('click')
    await wrapper.get('[data-test="role-teacher"]').trigger('click')
    await save(wrapper)

    expect(bodyOf(fetchMock, 'PATCH /user')).toEqual({ name: 'Ada' })
    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({
      avatar_color: 'sky',
      learner_role: 'teacher',
    })
    expect(wrapper.get('[data-test="toast-title"]').text()).toBe('Saved')
    expect(useAuthStore().user?.avatar_color).toBe('sky')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()
  })

  it('sends a confirmation link for a new email and shows it waiting', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/profile', {
      'POST /user/email': Response.json(
        { message: 'Check your new inbox and open the link to confirm.' },
        { status: 202 },
      ),
      'GET /user': [
        () => Response.json(makeUser()),
        () => Response.json(makeUser({ pending_email: 'ada@new.example' })),
      ],
    })

    await wrapper.get('[data-test="email"]').setValue('ada@new.example')
    await save(wrapper)

    expect(bodyOf(fetchMock, 'POST /user/email')).toEqual({ email: 'ada@new.example' })
    expect(wrapper.get('[data-test="toast-title"]').text()).toBe('Check your new inbox')
    expect(wrapper.get('[data-test="pending-email"]').text()).toContain('ada@new.example')
    // Your email only changes once you open the link.
    expect(wrapper.get<HTMLInputElement>('[data-test="email"]').element.value).toBe(
      'ada@example.com',
    )
  })

  it('shows the API’s message next to the field it is about', async () => {
    const message = 'That email already has an account. Use another one.'
    const { wrapper } = await mountSettings('/settings/profile', {
      'POST /user/email': invalid('email', message),
    })

    await wrapper.get('[data-test="email"]').setValue('grace@example.com')
    await save(wrapper)

    expect(wrapper.text()).toContain(message)
    expect(wrapper.get<HTMLInputElement>('[data-test="email"]').element.value).toBe(
      'grace@example.com',
    )
  })

  it('puts everything back on Discard', async () => {
    const { wrapper } = await mountSettings('/settings/profile')

    await wrapper.get('[data-test="name"]').setValue('Grace')
    await wrapper.get('[data-test="role-curious"]').trigger('click')
    await wrapper.get('[data-test="discard"]').trigger('click')

    expect(wrapper.get<HTMLInputElement>('[data-test="name"]').element.value).toBe('Ada Lovelace')
    expect(wrapper.get('[data-test="role-curious"]').attributes('aria-pressed')).toBe('false')
  })
})
