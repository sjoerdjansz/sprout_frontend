import { describe, expect, it } from 'vitest'
import { daysUntil, dueLabel } from '../dueDate'

// Local time, as a learner's device would have it.
const now = new Date(2026, 9, 30, 23, 30)

describe('dueDate', () => {
  it('counts whole days from today on this device', () => {
    expect(daysUntil('2026-10-30', now)).toBe(0)
    expect(daysUntil('2026-11-02', now)).toBe(3)
    expect(daysUntil('2026-10-28', now)).toBe(-2)
  })

  it('says today, tomorrow or in how many days', () => {
    expect(dueLabel('2026-10-30', now)).toBe('today')
    expect(dueLabel('2026-10-31', now)).toBe('tomorrow')
    expect(dueLabel('2026-11-03', now)).toBe('in 4 days')
  })

  it('treats a date in the past as due today', () => {
    expect(dueLabel('2026-10-20', now)).toBe('today')
  })
})
