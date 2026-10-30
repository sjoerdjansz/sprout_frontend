/*
 * The API sends review dates as YYYY-MM-DD, already in your timezone. These helpers compare them
 * with today's date on this device, so "today" means the same day the API counted as today.
 */

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** Whole days from today to a YYYY-MM-DD date; 0 for today, negative when it's in the past. */
export function daysUntil(date: string, now: Date = new Date()): number {
  // Both as UTC midnight, so a daylight saving switch in between can't make a day 23 hours long.
  const target = Date.parse(`${date}T00:00:00Z`)
  const today = Date.parse(`${localDateKey(now)}T00:00:00Z`)

  return Math.round((target - today) / (24 * 60 * 60 * 1000))
}

/** "today", "tomorrow", "in 4 days". A date in the past counts as today: it's due now. */
export function dueLabel(date: string, now: Date = new Date()): string {
  const days = daysUntil(date, now)

  if (days <= 0) {
    return 'today'
  }
  if (days === 1) {
    return 'tomorrow'
  }

  return `in ${days} days`
}
