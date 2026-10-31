import type { ApiError } from '@/lib/api'

/**
 * The message to show when sending to the tutor failed. A problem with your message comes as a
 * field error; everything else (rate limit, the AI unavailable, offline) has its own message.
 */
export function chatErrorMessage(error: ApiError): string {
  return error.fieldError('message') ?? error.message
}
