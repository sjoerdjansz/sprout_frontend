import { useAuthStore } from '@/stores/auth'

const baseUrl = import.meta.env.VITE_API_URL

/**
 * Thrown for any non-2xx response, or when the API can't be reached (status 0).
 */
export class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

/**
 * Call the Sprout API. Sends JSON, attaches the Sanctum bearer token when the
 * user is signed in, and returns the parsed JSON body (or null for 204).
 */
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const auth = useAuthStore()

  const request = {
    method,
    headers: {
      Accept: 'application/json',
      ...(auth.token && { Authorization: `Bearer ${auth.token}` }),
      ...headers,
    },
  }

  if (body !== undefined) {
    request.headers['Content-Type'] = 'application/json'
    request.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`${baseUrl}${path}`, request)
  } catch {
    throw new ApiError(0, "Can't reach Sprout right now. Check your connection and try again.")
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      auth.clearToken()
    }

    throw new ApiError(response.status, data?.message ?? 'Something went wrong.', data?.errors)
  }

  return data
}
