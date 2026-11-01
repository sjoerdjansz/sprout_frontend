import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { makeMaterial } from '@/__tests__/conversationFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { ApiError } from '@/lib/api'
import { useMaterialsStore } from '@/stores/materials'

describe('materials store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads a file as multipart form data', async () => {
    const fetchMock = stubApi({
      'POST /materials': Response.json(makeMaterial({ status: 'processing' }), { status: 201 }),
    })
    const file = new File(['# Notes'], 'Lecture 1.md')

    const material = await useMaterialsStore().upload(file)

    const body = fetchMock.mock.calls[0]?.[1]?.body
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBeInstanceOf(File)
    expect(((body as FormData).get('file') as File).name).toBe('Lecture 1.md')
    expect(material.status).toBe('processing')
  })

  it('fetches a file to see whether it has been read', async () => {
    stubApi({ 'GET /materials/7': Response.json(makeMaterial({ status: 'ready' })) })

    expect((await useMaterialsStore().fetchMaterial(7)).status).toBe('ready')
  })

  it('removes a file you have not sent', async () => {
    const fetchMock = stubApi({ 'DELETE /materials/7': new Response(null, { status: 204 }) })

    await useMaterialsStore().remove(7)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lets the API’s errors reach the caller as an ApiError', async () => {
    stubApi({
      'POST /materials': Response.json(
        { message: 'Keep files under 10 MB.', errors: { file: ['Keep files under 10 MB.'] } },
        { status: 422 },
      ),
    })

    const upload = useMaterialsStore().upload(new File(['x'], 'big.pdf'))

    await expect(upload).rejects.toBeInstanceOf(ApiError)
    await expect(upload).rejects.toMatchObject({ status: 422 })
  })
})
