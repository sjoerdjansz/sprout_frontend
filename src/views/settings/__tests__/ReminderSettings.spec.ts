import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { bodyOf, mountSettings } from '@/__tests__/mountSettings'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { reminderTimes } from '@/lib/settingsOptions'
import { useAuthStore } from '@/stores/auth'

describe('ReminderSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows your reminders', async () => {
    const { wrapper } = await mountSettings('/settings/reminders')

    expect(wrapper.get<HTMLSelectElement>('[data-test="reminder-time"]').element.value).toBe(
      '19:00',
    )
    expect(wrapper.get('[data-test="tab-email"]').attributes('aria-selected')).toBe('true')
  })

  it('saves a new time', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/reminders', {
      'PATCH /settings': Response.json(makeSettings({ reminder_time: '07:30' })),
    })

    await wrapper.get('[data-test="reminder-time"]').setValue('07:30')
    await flushPromises()

    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({ reminder_time: '07:30' })
  })

  it('only lets you pick a time while the daily reminder is on', async () => {
    const { wrapper } = await mountSettings('/settings/reminders', {
      'GET /settings': Response.json(makeSettings({ wants_daily_reminder: false })),
    })

    expect(wrapper.get('[data-test="reminder-time"]').attributes('disabled')).toBeDefined()
  })

  it('saves where reminders go', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/reminders', {
      'PATCH /settings': Response.json(makeSettings({ reminder_channel: 'both' })),
    })

    await wrapper.get('[data-test="tab-both"]').trigger('click')
    await flushPromises()

    expect(bodyOf(fetchMock, 'PATCH /settings')).toEqual({ reminder_channel: 'both' })
  })
})

describe('reminderTimes', () => {
  it('offers every half hour, plus a saved time in between', () => {
    expect(reminderTimes('19:00')).toHaveLength(48)
    const times = reminderTimes('07:45')
    expect(times).toHaveLength(49)
    expect(times.slice(15, 18)).toEqual(['07:30', '07:45', '08:00'])
  })
})
