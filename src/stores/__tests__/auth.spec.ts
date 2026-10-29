import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore, type User } from '../auth'

const apiUrl = import.meta.env.VITE_API_URL

const ada: User = {
  id: 1,
  name: 'Ada',
  email: 'ada@example.com',
  email_verified_at: '2026-10-29T17:30:58.000000Z',
  interests: ['science'],
  wants_daily_reminder: true,
  created_at: '2026-10-29T17:30:56.000000Z',
}

function requestBody(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>): unknown {
  const request = fetchMock.mock.calls[0]?.[1]

  return JSON.parse(String(request?.body))
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registers an account', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: 'Check your inbox.' }, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    await useAuthStore().register({
      name: 'Ada',
      email: 'ada@example.com',
      interests: ['science'],
      wants_daily_reminder: true,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/auth/register`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(requestBody(fetchMock)).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      interests: ['science'],
      wants_daily_reminder: true,
    })
  })

  it('requests a magic link', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: 'Check your inbox.' }, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    await useAuthStore().requestMagicLink('ada@example.com')

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/auth/login`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(requestBody(fetchMock)).toEqual({ email: 'ada@example.com' })
  })

  it('signs in with the token from a magic link', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ token: '1|abc', user: ada }))
    vi.stubGlobal('fetch', fetchMock)
    const auth = useAuthStore()

    await auth.verifyMagicLink('magic-token')

    expect(requestBody(fetchMock)).toEqual({ token: 'magic-token' })
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual(ada)
    expect(localStorage.getItem('sprout.token')).toBe('1|abc')
  })

  it('signs out locally even when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')))
    const auth = useAuthStore()
    auth.setToken('1|abc')

    await expect(auth.logout()).rejects.toThrow("Can't reach Sprout right now.")

    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('sprout.token')).toBeNull()
  })
})
