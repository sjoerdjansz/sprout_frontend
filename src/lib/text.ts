/** "today" → "Today", for a value that starts a line or a label. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
