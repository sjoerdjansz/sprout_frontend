import { describe, expect, it } from 'vitest'
import { emailError } from '../email'

describe('emailError', () => {
  it('accepts an email address, ignoring surrounding spaces', () => {
    expect(emailError('  ada@example.com ')).toBeNull()
  })

  it('asks for an email when it is empty', () => {
    expect(emailError('   ')).toBe('Enter your email address.')
  })

  it('says what to do when it is not an email address', () => {
    expect(emailError('ada@example')).toBe(
      'That doesn’t look like an email address. Check it and try again.',
    )
  })
})
