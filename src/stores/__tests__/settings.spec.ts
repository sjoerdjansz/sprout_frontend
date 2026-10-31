import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { makeSettings, makeUser } from '@/__tests__/settingsFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { useAuthStore } from '../auth'
import { useSettingsStore } from '../settings'

function requestBody(fetchMock: ReturnType<typeof stubApi>, callIndex = 0): unknown {
  return JSON.parse(String(fetchMock.mock.calls[callIndex]?.[1]?.body))
}

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads your settings once when two screens ask at the same time', async () => {
    const fetchMock = stubApi({ 'GET /settings': Response.json(makeSettings()) })
    const store = useSettingsStore()

    await Promise.all([store.fetchSettings(), store.fetchSettings()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.settings?.ai_level).toBe('medium')
  })

  it('sends only what changed and keeps the full answer', async () => {
    const fetchMock = stubApi({
      'PATCH /settings': Response.json(makeSettings({ theme: 'dark', reduce_motion: true })),
    })
    const store = useSettingsStore()

    await store.updateSettings({ theme: 'dark', reduce_motion: true })

    expect(requestBody(fetchMock)).toEqual({ theme: 'dark', reduce_motion: true })
    expect(store.settings?.theme).toBe('dark')
  })

  it('keeps the avatar colour of the signed-in user in step', async () => {
    stubApi({ 'PATCH /settings': Response.json(makeSettings({ avatar_color: 'sky' })) })
    const auth = useAuthStore()
    auth.user = makeUser()

    await useSettingsStore().updateSettings({ avatar_color: 'sky' })

    expect(auth.user.avatar_color).toBe('sky')
  })

  it('sends the browser timezone when yours is different', async () => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const fetchMock = stubApi({
      'GET /settings': Response.json(makeSettings({ timezone: 'Pacific/Fiji' })),
      'PATCH /settings': Response.json(makeSettings()),
    })
    const store = useSettingsStore()
    await store.fetchSettings()

    await store.syncTimezone()

    expect(requestBody(fetchMock, 1)).toEqual({ timezone: browserTimezone })
  })

  it('leaves the timezone alone when it already matches', async () => {
    const fetchMock = stubApi({ 'GET /settings': Response.json(makeSettings()) })
    const store = useSettingsStore()
    await store.fetchSettings()

    await store.syncTimezone()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
