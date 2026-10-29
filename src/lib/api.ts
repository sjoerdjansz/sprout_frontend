import { useAuthStore } from '@/stores/auth'

const baseUrl = import.meta.env.VITE_API_URL

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Laravel validation errors: every invalid field with its messages. */
export type ValidationErrors = Record<string, string[]>

export interface ApiOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Thrown for any non-2xx response, or when the API can't be reached (status 0).
 */
export class ApiError extends Error {
  readonly status: number
  readonly errors: ValidationErrors

  constructor(status: number, message: string, errors: ValidationErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  /**
   * The first validation message for a field, including its array items
   * (`interests.0` counts for `interests`).
   */
  fieldError(field: string): string | undefined {
    const key = Object.keys(this.errors).find(
      (errorKey) => errorKey === field || errorKey.startsWith(`${field}.`),
    )

    return key === undefined ? undefined : this.errors[key]?.[0]
  }

  get hasFieldErrors(): boolean {
    return Object.keys(this.errors).length > 0
  }
}

/**
 * Call the Sprout API. Sends JSON, attaches the Sanctum bearer token when the
 * user is signed in, and returns the parsed JSON body (or null for 204).
 *
 * The type parameter describes the response shape; it isn't checked at runtime.
 */
export async function api<T = unknown>(
  path: string,
  { method = 'GET', body, headers = {} }: ApiOptions = {},
): Promise<T> {
  const auth = useAuthStore()

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(auth.token && { Authorization: `Bearer ${auth.token}` }),
    ...headers,
  }
  const request: RequestInit = { method, headers: requestHeaders }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
    request.body = JSON.stringify(body)
  }

  let response: Response
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

  return data as T
}
