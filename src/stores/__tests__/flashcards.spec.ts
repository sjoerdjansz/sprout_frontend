import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { makeFlashcard } from '@/__tests__/materialFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { useFlashcardsStore } from '../flashcards'

describe('flashcards store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("fetches a subtopic's cards", async () => {
    stubApi({ 'GET /subtopics/101/flashcards': Response.json([makeFlashcard()]) })
    const store = useFlashcardsStore()

    await store.fetchFlashcards(101)

    expect(store.flashcards).toHaveLength(1)
  })

  it('adds a card you wrote at the end', async () => {
    const written = makeFlashcard({ id: 42, origin: 'user', is_due: true, recall: null })
    const fetchMock = stubApi({
      'POST /subtopics/101/flashcards': Response.json(written, { status: 201 }),
    })
    const store = useFlashcardsStore()
    store.flashcards = [makeFlashcard()]

    await store.addFlashcard(101, { front: 'Front', back: 'Back' })

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      front: 'Front',
      back: 'Back',
    })
    expect(store.flashcards.map((card) => card.id)).toEqual([41, 42])
  })

  it('edits, pauses and resumes a card in place', async () => {
    stubApi({
      'PUT /flashcards/41': Response.json(makeFlashcard({ front: 'Sharper front' })),
      'POST /flashcards/41/pause': Response.json(makeFlashcard({ paused: true })),
      'POST /flashcards/41/resume': Response.json(makeFlashcard({ paused: false })),
    })
    const store = useFlashcardsStore()
    store.flashcards = [makeFlashcard()]

    await store.editFlashcard(41, { front: 'Sharper front', back: 'In the chloroplasts.' })
    expect(store.flashcards[0]?.front).toBe('Sharper front')

    await store.setPaused(41, true)
    expect(store.flashcards[0]?.paused).toBe(true)

    await store.setPaused(41, false)
    expect(store.flashcards[0]?.paused).toBe(false)
  })

  it('deletes a card', async () => {
    stubApi({ 'DELETE /flashcards/41': new Response(null, { status: 204 }) })
    const store = useFlashcardsStore()
    store.flashcards = [makeFlashcard(), makeFlashcard({ id: 43 })]

    await store.deleteFlashcard(41)

    expect(store.flashcards.map((card) => card.id)).toEqual([43])
  })
})
