import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '../index'
import { useAuthStore } from '@/stores/auth'

describe('router guards', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('sends signed out visitors from home to the login screen', async () => {
    await router.push('/')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('sends signed in users from the login screen home', async () => {
    useAuthStore().setToken('1|abc')

    await router.push('/sign-up')

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('lets everyone open a magic link', async () => {
    useAuthStore().setToken('1|abc')

    await router.push('/auth/verify?token=abc')

    expect(router.currentRoute.value.name).toBe('verify')
  })
})
