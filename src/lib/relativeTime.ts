const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const minute = 60
const hour = 60 * minute
const day = 24 * hour
const week = 7 * day
const month = 30 * day
const year = 365 * day

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago": how long ago an API timestamp was. */
export function relativeTime(timestamp: string, now: Date = new Date()): string {
  const secondsAgo = Math.max(0, (now.getTime() - new Date(timestamp).getTime()) / 1000)

  if (secondsAgo < minute) {
    return 'just now'
  }
  if (secondsAgo < hour) {
    return formatter.format(-Math.floor(secondsAgo / minute), 'minute')
  }
  if (secondsAgo < day) {
    return formatter.format(-Math.floor(secondsAgo / hour), 'hour')
  }
  if (secondsAgo < week) {
    return formatter.format(-Math.floor(secondsAgo / day), 'day')
  }
  if (secondsAgo < month) {
    return formatter.format(-Math.floor(secondsAgo / week), 'week')
  }
  if (secondsAgo < year) {
    return formatter.format(-Math.floor(secondsAgo / month), 'month')
  }

  return formatter.format(-Math.floor(secondsAgo / year), 'year')
}
