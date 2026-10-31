import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { bodyOf, mountSettings } from '@/__tests__/mountSettings'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { useAuthStore } from '@/stores/auth'

describe('LearningSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows your learning defaults', async () => {
    const { wrapper } = await mountSettings('/settings/learning', {
      'GET /settings': Response.json(
        makeSettings({ daily_goal_cards: 40, hint_before_answer: false }),
      ),
    })

    expect(
      wrapper.get('[data-test="daily-goal"] [data-test="tab-40"]').attributes('aria-selected'),
    ).toBe('true')
    expect(wrapper.get('[data-test="hint-first"] [role="switch"]').attributes('aria-checked')).toBe(
      'false',
    )
    expect(wrapper.get('[data-test="interleave"] [role="switch"]').attributes('aria-checked')).toBe(
      'true',
    )
  })

  it('saves a daily goal as a number', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/learning', {
      'PATCH /settings': Response.json(makeSettings({ daily_goal_cards: 10 })),
    })

    await wrapper.get('[data-test="daily-goal"] [data-test="tab-10"]').trigger('click')
    await flushPromises()

    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({ daily_goal_cards: 10 })
  })

  it('saves a switch as soon as you flip it', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/learning', {
      'PATCH /settings': Response.json(makeSettings({ save_chats_as_material: false })),
    })

    await wrapper.get('[data-test="save-chats"] [role="switch"]').trigger('click')
    await flushPromises()

    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({ save_chats_as_material: false })
    expect(wrapper.get('[data-test="save-chats"] [role="switch"]').attributes('aria-checked')).toBe(
      'false',
    )
    expect(wrapper.get('[data-test="toast-title"]').text()).toBe('Saved')
  })

  it('flips a switch back when saving fails', async () => {
    const { wrapper } = await mountSettings('/settings/learning', {
      'PATCH /settings': Response.json({ message: 'Something went wrong.' }, { status: 500 }),
    })

    await wrapper.get('[data-test="interleave"] [role="switch"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="interleave"] [role="switch"]').attributes('aria-checked')).toBe(
      'true',
    )
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Something went wrong.')
  })
})
