import { describe, expect, it } from 'vitest'
import { dayOverline, greeting } from '../greeting'

describe('greeting', () => {
  it('fits the time of day', () => {
    expect(greeting(new Date(2026, 9, 29, 9, 0))).toBe('Good morning')
    expect(greeting(new Date(2026, 9, 29, 12, 0))).toBe('Good afternoon')
    expect(greeting(new Date(2026, 9, 29, 18, 0))).toBe('Good evening')
  })
})

describe('dayOverline', () => {
  it('names the weekday, day and month in capitals', () => {
    expect(dayOverline(new Date(2026, 9, 29, 15, 0))).toBe('THURSDAY 29 OCTOBER')
  })
})
