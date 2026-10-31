import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { bodyOf, mountSettings } from '@/__tests__/mountSettings'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { useAuthStore } from '@/stores/auth'
import { usagePeriod } from '@/lib/settingsOptions'

const usage = {
  month: '2026-10',
  tutor_replies: 29,
  answers_checked: 0,
  explain_feedback: 0,
  card_batches: 3,
  subtopic_suggestions: 1,
  total: 33,
}

describe('AiSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows your effort with what it means', async () => {
    const { wrapper } = await mountSettings('/settings/ai', {
      'GET /settings/usage': Response.json(usage),
    })

    expect(wrapper.get('[data-test="tab-medium"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="effort-note"]').text()).toContain('The default.')
  })

  it('saves a new effort straight away', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/ai', {
      'GET /settings/usage': Response.json(usage),
      'PATCH /settings': Response.json(makeSettings({ ai_level: 'high' })),
    })

    await wrapper.get('[data-test="tab-high"]').trigger('click')
    await flushPromises()

    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({ ai_level: 'high' })
    expect(wrapper.get('[data-test="effort-note"]').text()).toContain('Thinks it through.')
    expect(wrapper.get('[data-test="toast-title"]').text()).toBe('Saved')
  })

  it('puts the old effort back when saving fails', async () => {
    const { wrapper } = await mountSettings('/settings/ai', {
      'GET /settings/usage': Response.json(usage),
      'PATCH /settings': Response.json(
        {
          message: 'Pick low, medium or high.',
          errors: { ai_level: ['Pick low, medium or high.'] },
        },
        { status: 422 },
      ),
    })

    await wrapper.get('[data-test="tab-low"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="tab-medium"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Pick low, medium or high.')
  })

  it('counts this month’s AI calls per kind', async () => {
    const { wrapper } = await mountSettings('/settings/ai', {
      'GET /settings/usage': Response.json(usage),
    })

    expect(wrapper.get('[data-test="usage-period"]').text()).toBe('1–31 October')
    expect(wrapper.get('[data-test="usage-total"]').text()).toBe('33')
    expect(wrapper.get('[data-test="usage-tutor_replies"]').text()).toContain('29')
    expect(wrapper.get('[data-test="usage-card_batches"]').text()).toContain('3')
    expect(wrapper.get('[data-test="usage-subtopic_suggestions"]').text()).toContain(
      'Sources split up',
    )
  })

  it('offers to try again when usage can’t load', async () => {
    const { wrapper } = await mountSettings('/settings/ai', {
      'GET /settings/usage': [
        () => Response.json({ message: 'Something went wrong.' }, { status: 500 }),
        () => Response.json(usage),
      ],
    })

    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Something went wrong.')

    const retry = wrapper.findAll('button').find((button) => button.text() === 'Try again')
    await retry?.trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="usage-total"]').text()).toBe('33')
  })
})

describe('usagePeriod', () => {
  it('spans the whole month', () => {
    expect(usagePeriod('2026-02')).toBe('1–28 February')
    expect(usagePeriod('2028-02')).toBe('1–29 February')
    expect(usagePeriod('2026-11')).toBe('1–30 November')
  })
})
