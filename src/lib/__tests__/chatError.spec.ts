import { describe, expect, it } from 'vitest'
import { ApiError } from '../api'
import { chatErrorMessage } from '../chatError'

describe('chatErrorMessage', () => {
  it('shows what is wrong with your message', () => {
    const error = new ApiError(422, 'Type a message first.', { message: ['Type a message first.'] })

    expect(chatErrorMessage(error)).toBe('Type a message first.')
  })

  it('shows what is wrong with your AI key', () => {
    const error = new ApiError(422, 'Connect your AI key to start learning.', {
      ai_key: ['Connect your AI key to start learning.'],
    })

    expect(chatErrorMessage(error)).toBe('Connect your AI key to start learning.')
  })

  it('falls back to the general message', () => {
    const error = new ApiError(503, 'The tutor can’t answer right now. Try again in a moment.')

    expect(chatErrorMessage(error)).toBe('The tutor can’t answer right now. Try again in a moment.')
  })
})
