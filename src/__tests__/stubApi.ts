import { vi } from 'vitest'

const apiUrl = import.meta.env.VITE_API_URL

/** What a route answers: one response, or a list for successive calls (the last one repeats). */
type Respond = () => Response | Promise<Response>
type RouteAnswer = Response | Respond | Respond[]

/**
 * Stubs `fetch` with answers per route, keyed as "METHOD /path" (e.g. "POST /conversations").
 * A request without an answer fails the test, so a screen can't quietly call something new.
 */
export function stubApi(
  routes: Record<string, RouteAnswer>,
): ReturnType<typeof vi.fn<typeof fetch>> {
  const callCounts: Record<string, number> = {}

  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const path = String(input).replace(apiUrl, '')
    const route = `${init?.method ?? 'GET'} ${path}`
    const answer = routes[route]

    if (answer === undefined) {
      throw new Error(`No stubbed answer for ${route}`)
    }

    const callNumber = callCounts[route] ?? 0
    callCounts[route] = callNumber + 1

    if (Array.isArray(answer)) {
      const respond = answer[Math.min(callNumber, answer.length - 1)]
      if (respond === undefined) {
        throw new Error(`No stubbed answer for ${route}`)
      }

      return respond()
    }

    // A Response body can only be read once, so a function makes a fresh one per call.
    return typeof answer === 'function' ? answer() : answer.clone()
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}
