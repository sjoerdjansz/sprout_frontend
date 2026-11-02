import { describe, expect, it } from 'vitest'
import { capitalize, listOf } from '@/lib/text'

describe('text', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('today')).toBe('Today')
  })

  it('lists parts the way you would write them', () => {
    expect(listOf([])).toBe('')
    expect(listOf(['12 cards'])).toBe('12 cards')
    expect(listOf(['12 cards', '4 messages'])).toBe('12 cards and 4 messages')
    expect(listOf(['12 cards', '3 questions', '4 messages'])).toBe(
      '12 cards, 3 questions and 4 messages',
    )
  })
})
