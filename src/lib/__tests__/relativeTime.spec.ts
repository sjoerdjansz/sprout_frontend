import { describe, expect, it } from 'vitest'
import { relativeTime } from '../relativeTime'

const now = new Date('2026-10-30T15:00:00.000000Z')

describe('relativeTime', () => {
  it('says just now for the last minute', () => {
    expect(relativeTime('2026-10-30T14:59:30.000000Z', now)).toBe('just now')
  })

  it('counts minutes, hours and days', () => {
    expect(relativeTime('2026-10-30T14:55:00.000000Z', now)).toBe('5 minutes ago')
    expect(relativeTime('2026-10-30T13:00:00.000000Z', now)).toBe('2 hours ago')
    expect(relativeTime('2026-10-29T14:00:00.000000Z', now)).toBe('yesterday')
  })

  it('counts weeks, months and years', () => {
    expect(relativeTime('2026-10-16T15:00:00.000000Z', now)).toBe('2 weeks ago')
    expect(relativeTime('2026-08-30T15:00:00.000000Z', now)).toBe('2 months ago')
    expect(relativeTime('2024-10-30T15:00:00.000000Z', now)).toBe('2 years ago')
  })
})
