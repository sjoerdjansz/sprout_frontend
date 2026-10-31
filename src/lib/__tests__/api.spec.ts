import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { stubApi } from '@/__tests__/stubApi'
import { apiDownload } from '@/lib/api'

describe('apiDownload', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('takes the file name from the response', async () => {
    stubApi({
      'GET /user/export': new Response('{}', {
        headers: { 'Content-Disposition': 'attachment; filename="sprout-export-2026-10-31.json"' },
      }),
    })

    const file = await apiDownload('/user/export', 'fallback.json')

    expect(file.filename).toBe('sprout-export-2026-10-31.json')
    expect(await file.blob.text()).toBe('{}')
  })

  it('falls back to a name of its own without one', async () => {
    stubApi({ 'GET /user/export': new Response('{}') })

    expect((await apiDownload('/user/export', 'fallback.json')).filename).toBe('fallback.json')
  })

  it('fails like any other call', async () => {
    stubApi({
      'GET /user/export': Response.json({ message: 'Wait a minute.' }, { status: 429 }),
    })

    await expect(apiDownload('/user/export', 'fallback.json')).rejects.toMatchObject({
      status: 429,
      message: 'Wait a minute.',
    })
  })
})
