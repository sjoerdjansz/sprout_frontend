function nameParts(name: string): string[] {
  return name
    .trim()
    .split(/\s+/)
    .filter((part) => part !== '')
}

/** "Ada Lovelace" → "Ada", for greetings. */
export function firstName(name: string): string {
  return nameParts(name)[0] ?? ''
}

/** "Ada King Lovelace" → "AL": the first letters of the first and last name, for avatars. */
export function initials(name: string): string {
  const parts = nameParts(name)
  const first = parts[0]?.charAt(0) ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : ''

  return (first + last).toUpperCase()
}
