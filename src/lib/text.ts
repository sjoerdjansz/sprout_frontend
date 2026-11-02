/** "today" → "Today", for a value that starts a line or a label. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** ["12 cards", "3 questions", "4 messages"] → "12 cards, 3 questions and 4 messages". */
export function listOf(parts: string[]): string {
  if (parts.length <= 1) {
    return parts[0] ?? ''
  }

  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}
