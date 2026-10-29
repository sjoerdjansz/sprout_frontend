import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

const tokenKey = 'sprout.token'

export type Interest = 'languages' | 'science' | 'coding' | 'history' | 'maths' | 'other'

/** The signed-in user, as returned by `GET /user` and `POST /auth/verify`. */
export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  interests: Interest[]
  wants_daily_reminder: boolean
  created_at: string
}

/** The body of `POST /auth/register`. */
export interface Registration {
  name: string
  email: string
  interests: Interest[]
  wants_daily_reminder: boolean
}

interface VerifyResponse {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(tokenKey))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  function setToken(newToken: string): void {
    token.value = newToken
    localStorage.setItem(tokenKey, newToken)
  }

  function clearToken(): void {
    token.value = null
    user.value = null
    localStorage.removeItem(tokenKey)
  }

  async function fetchUser(): Promise<User> {
    const fetchedUser = await api<User>('/user')
    user.value = fetchedUser

    return fetchedUser
  }

  /** Creates the account and emails a magic link. */
  async function register(registration: Registration): Promise<void> {
    await api('/auth/register', { method: 'POST', body: registration })
  }

  /** Emails a magic link; the API answers the same whether or not the email has an account. */
  async function requestMagicLink(email: string): Promise<void> {
    await api('/auth/login', { method: 'POST', body: { email } })
  }

  /** Exchanges the token from a magic link for an API token and signs in. */
  async function verifyMagicLink(magicLinkToken: string): Promise<User> {
    const response = await api<VerifyResponse>('/auth/verify', {
      method: 'POST',
      body: { token: magicLinkToken },
    })
    setToken(response.token)
    user.value = response.user

    return response.user
  }

  async function logout(): Promise<void> {
    try {
      await api('/auth/logout', { method: 'POST' })
    } finally {
      // Sign out locally even when the API can't be reached; the error still reaches the caller.
      clearToken()
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    clearToken,
    fetchUser,
    register,
    requestMagicLink,
    verifyMagicLink,
    logout,
  }
})
