/** "Good morning" before noon, "Good afternoon" until six, "Good evening" after. */
export function greeting(now: Date): string {
  const hour = now.getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

/** "THURSDAY 29 OCTOBER": the overline above the greeting, written in capitals. */
export function dayOverline(now: Date): string {
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dayAndMonth = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

  return `${weekday} ${dayAndMonth}`.toUpperCase()
}
