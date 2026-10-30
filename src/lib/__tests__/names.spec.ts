import { describe, expect, it } from 'vitest'
import { firstName, initials } from '../names'

describe('firstName', () => {
  it('takes the first word of the name', () => {
    expect(firstName('  Ada King Lovelace ')).toBe('Ada')
  })

  it('is empty for an empty name', () => {
    expect(firstName('  ')).toBe('')
  })
})

describe('initials', () => {
  it('uses the first letters of the first and last name', () => {
    expect(initials('ada King lovelace')).toBe('AL')
  })

  it('uses one letter for a single name', () => {
    expect(initials('Ada')).toBe('A')
  })

  it('is empty for an empty name', () => {
    expect(initials('')).toBe('')
  })
})
