import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

const tokenKey = 'sprout.token'

export type Interest = 'languages' | 'science' | 'coding' | 'history' | 'maths' | 'other'

/** The tint behind your initials: one of the four topic-tile tints. */
export type AvatarColor = 'sun' | 'mint' | 'peach' | 'sky'

/** The signed-in user, as returned by `GET /user` and `POST /auth/verify`. */
export interface User {
  id: number
  name: string
  email: string
  /** The new address while an email change waits to be confirmed from that inbox. */
  pending_email: string | null
  email_verified_at: string | null
  avatar_color: AvatarColor
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

interface MessageResponse {
  message: string
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

  /** Changes the name Sprout calls you by. */
  async function updateName(name: string): Promise<User> {
    const updatedUser = await api<User>('/user', { method: 'PATCH', body: { name } })
    user.value = updatedUser

    return updatedUser
  }

  /**
   * Emails a confirmation link to the new address; the email only changes once that link is
   * opened. Returns the API's message ("Check your new inbox…").
   */
  async function requestEmailChange(email: string): Promise<string> {
    const response = await api<MessageResponse>('/user/email', {
      method: 'POST',
      body: { email },
    })
    // The user now has the new address as `pending_email`.
    await fetchUser()

    return response.message
  }

  /** Confirms an email change with the token from the link; works signed out too. */
  async function confirmEmailChange(emailChangeToken: string): Promise<User> {
    const confirmedUser = await api<User>('/user/email/confirm', {
      method: 'POST',
      body: { token: emailChangeToken },
    })
    if (user.value?.id === confirmedUser.id) {
      user.value = confirmedUser
    }

    return confirmedUser
  }

  /** Deletes the account and everything in it, confirmed by typing its email. */
  async function deleteAccount(email: string): Promise<void> {
    await api('/user', { method: 'DELETE', body: { email } })
    clearToken()
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
    updateName,
    requestEmailChange,
    confirmEmailChange,
    deleteAccount,
    logout,
  }
})
