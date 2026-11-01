import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { stubApi } from '@/__tests__/stubApi'
import { api, apiDownload } from '@/lib/api'

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

describe('api', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a body as JSON', async () => {
    const fetchMock = stubApi({ 'POST /topics': Response.json({ id: 1 }, { status: 201 }) })

    await api('/topics', { method: 'POST', body: { title: 'Jazz' } })

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.body).toBe('{"title":"Jazz"}')
    expect(init?.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    })
  })

  it('sends FormData as it is, leaving the Content-Type to the browser', async () => {
    const fetchMock = stubApi({ 'POST /materials': Response.json({ id: 7 }, { status: 201 }) })
    const form = new FormData()
    form.append('file', new File(['notes'], 'notes.md'))

    await api('/materials', { method: 'POST', body: form })

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.body).toBe(form)
    expect(init?.headers).toMatchObject({ Accept: 'application/json' })
    expect(init?.headers).not.toHaveProperty('Content-Type')
  })
})
