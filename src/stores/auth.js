import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

const tokenKey = 'sprout.token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(tokenKey))
  const user = ref(null)

  const isAuthenticated = computed(() => token.value !== null)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem(tokenKey, newToken)
  }

  function clearToken() {
    token.value = null
    user.value = null
    localStorage.removeItem(tokenKey)
  }

  async function fetchUser() {
    user.value = await api('/user')

    return user.value
  }

  return { token, user, isAuthenticated, setToken, clearToken, fetchUser }
})
