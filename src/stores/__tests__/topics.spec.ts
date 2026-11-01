import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { stubApi } from '@/__tests__/stubApi'
import {
  makeCategories,
  makeLibrary,
  makeSubtopic,
  makeSubtopicDetail,
  makeTopic,
} from '@/__tests__/topicFixtures'
import { useTopicsStore } from '../topics'

function requestBody(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, call = 0): unknown {
  const request = fetchMock.mock.calls[call]?.[1]

  return JSON.parse(String(request?.body))
}

function subtopicTitles(topicId: number): string[] {
  const topic = useTopicsStore().topics.find((candidate) => candidate.id === topicId)

  return topic?.subtopics.map((subtopic) => subtopic.title) ?? []
}

describe('topics store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches your topics and categories', async () => {
    stubApi({
      'GET /topics': Response.json(makeLibrary()),
      'GET /categories': Response.json(makeCategories()),
    })
    const store = useTopicsStore()

    await store.fetchLibrary()

    expect(store.topics).toHaveLength(4)
    expect(store.categories).toHaveLength(6)
  })

  it('adds a topic in a new category, sending its name instead of an id', async () => {
    const astronomy = makeTopic({ id: 9, title: 'Astronomy', category: { id: 31, name: 'Space' } })
    const fetchMock = stubApi({ 'POST /topics': Response.json(astronomy, { status: 201 }) })
    const store = useTopicsStore()

    await store.addTopic({
      title: 'Astronomy',
      description: '',
      notes: 'NASA site',
      categoryId: null,
      categoryName: 'Space',
    })

    expect(requestBody(fetchMock)).toEqual({
      title: 'Astronomy',
      description: null,
      notes: 'NASA site',
      category_name: 'Space',
    })
    expect(store.topics.map((topic) => topic.title)).toEqual(['Astronomy'])
    expect(store.categories).toEqual([{ id: 31, name: 'Space' }])
  })

  it('edits a topic in place', async () => {
    const fetchMock = stubApi({
      'PUT /topics/1': Response.json(makeTopic({ title: 'Biology basics' })),
    })
    const store = useTopicsStore()
    store.topics = makeLibrary()

    await store.updateTopic(1, {
      title: 'Biology basics',
      description: 'Cells',
      notes: '',
      categoryId: 1,
      categoryName: '',
    })

    expect(requestBody(fetchMock)).toMatchObject({ category_id: 1, notes: null })
    expect(store.topics.map((topic) => topic.title)).toContain('Biology basics')
  })

  it('adds a subtopic at the end of its topic, generating its cards', async () => {
    const respiration = makeSubtopic({
      id: 501,
      title: 'Respiration',
      is_new: true,
      generation_status: 'generating',
    })
    stubApi({
      'POST /subtopics': Response.json({ subtopic: respiration }, { status: 201 }),
    })
    const store = useTopicsStore()
    store.topics = makeLibrary()

    const result = await store.addSubtopic({
      topicId: 1,
      title: 'Respiration',
      description: '',
      notes: 'Cells release energy.',
    })

    expect(result.subtopic.generation_status).toBe('generating')
    expect(subtopicTitles(1).slice(-1)[0]).toBe('Respiration')
  })

  it('moves an edited subtopic to the end of its new topic', async () => {
    const moved = makeSubtopic({ topic_id: 2 })
    stubApi({
      'PUT /subtopics/101': Response.json({ subtopic: moved }),
    })
    const store = useTopicsStore()
    store.topics = makeLibrary()

    await store.updateSubtopic(101, {
      topicId: 2,
      title: 'Photosynthesis',
      description: '',
      notes: '',
    })

    expect(subtopicTitles(1)).not.toContain('Photosynthesis')
    expect(subtopicTitles(2).slice(-1)[0]).toBe('Photosynthesis')
  })

  it('fetches one subtopic for its page', async () => {
    stubApi({ 'GET /subtopics/101': Response.json(makeSubtopicDetail()) })
    const store = useTopicsStore()

    await store.fetchSubtopic(101)

    expect(store.subtopic?.topic.title).toBe('Biology')
    expect(store.subtopic?.counts.flashcards).toBe(2)
  })

  it('removes one of a subtopic’s sources', async () => {
    const fetchMock = stubApi({
      'DELETE /subtopics/101/sources/51': new Response(null, { status: 204 }),
    })

    await useTopicsStore().removeSource(101, 51)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('deletes a subtopic from the page and the library', async () => {
    stubApi({ 'DELETE /subtopics/101': new Response(null, { status: 204 }) })
    const store = useTopicsStore()
    store.topics = makeLibrary()
    store.subtopic = makeSubtopicDetail()

    await store.deleteSubtopic(101)

    expect(subtopicTitles(1)).not.toContain('Photosynthesis')
    expect(store.subtopic).toBeNull()
  })

  it('queues material from the notes and shows the page the subtopic generating', async () => {
    const fetchMock = stubApi({
      'POST /subtopics/101/generate': Response.json(
        { subtopic: makeSubtopic({ generation_status: 'generating' }) },
        { status: 202 },
      ),
    })
    const store = useTopicsStore()
    store.topics = makeLibrary()
    store.subtopic = makeSubtopicDetail({ generation_status: 'failed' })

    const result = await store.generateMaterial(101)

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBeUndefined()
    expect(result.subtopic.generation_status).toBe('generating')
    expect(store.subtopic?.generation_status).toBe('generating')
    // The page's own fields (its topic and counts) stay.
    expect(store.subtopic?.counts.flashcards).toBe(2)
  })

  it('fetches only the topics again, to see whether material is done', async () => {
    stubApi({
      'GET /topics': Response.json([
        makeTopic({ subtopics: [makeSubtopic({ generation_status: 'ready' })] }),
      ]),
    })
    const store = useTopicsStore()

    await store.fetchTopics()

    expect(store.topics[0]?.subtopics[0]?.generation_status).toBe('ready')
  })

  it('asks for subtopic suggestions from the saved topic, without a body', async () => {
    const fetchMock = stubApi({
      'POST /topics/1/subtopic-suggestions': Response.json({
        suggestions: [{ title: 'Cadence', description: 'Steps per minute.', notes: '# Cadence' }],
      }),
    })

    const suggestions = await useTopicsStore().suggestSubtopics(1)

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBeUndefined()
    expect(suggestions.map((suggestion) => suggestion.title)).toEqual(['Cadence'])
  })

  it('adds the subtopics you kept at the end of the topic', async () => {
    const fetchMock = stubApi({
      'POST /topics/1/subtopics': Response.json(
        {
          subtopics: [makeSubtopic({ id: 601, title: 'Cadence' })],
          added: { subtopics: 1 },
        },
        { status: 201 },
      ),
    })
    const store = useTopicsStore()
    store.topics = makeLibrary()

    const result = await store.addSubtopics(1, [
      { title: 'Cadence', description: null, notes: '# Cadence' },
    ])

    expect(requestBody(fetchMock)).toEqual({
      subtopics: [{ title: 'Cadence', description: null, notes: '# Cadence' }],
    })
    expect(subtopicTitles(1)[subtopicTitles(1).length - 1]).toBe('Cadence')
    expect(result.added).toEqual({ subtopics: 1 })
  })
})
