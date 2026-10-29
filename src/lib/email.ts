/**
 * Quick feedback before a form is sent; the backend still validates the email itself.
 * Returns the message to show, or null when the email looks fine.
 */
export function emailError(email: string): string | null {
  const trimmedEmail = email.trim()

  if (trimmedEmail === '') {
    return 'Enter your email address.'
  }

  // Deliberately loose: something@something.something. The real check is the email arriving.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'That doesn’t look like an email address. Check it and try again.'
  }

  return null
}
