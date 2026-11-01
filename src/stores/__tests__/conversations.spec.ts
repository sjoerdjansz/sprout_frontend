import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/lib/api'
import { useConversationsStore, type ReviewedDraft } from '../conversations'
import { makeConversation, makeSummary } from '@/__tests__/conversationFixtures'
import { stubApi } from '@/__tests__/stubApi'

const apiUrl = import.meta.env.VITE_API_URL

function requestBody(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, call = 0): unknown {
  const request = fetchMock.mock.calls[call]?.[1]

  return JSON.parse(String(request?.body))
}

describe('conversations store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the chat history', async () => {
    const history = [makeSummary(), makeSummary({ id: 7, title: 'Photosynthesis', is_saved: true })]
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json(history)))
    const store = useConversationsStore()

    await store.fetchConversations()

    expect(store.conversations).toEqual(history)
  })

  it('fetches one conversation with its messages', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(makeConversation()))
    vi.stubGlobal('fetch', fetchMock)
    const store = useConversationsStore()

    await store.fetchConversation(10)

    expect(fetchMock).toHaveBeenCalledWith(`${apiUrl}/conversations/10`, expect.anything())
    expect(store.conversation?.messages).toHaveLength(2)
  })

  it('starts a conversation and puts it at the top of the history', async () => {
    const started = makeConversation({ id: 11, last_activity_at: '2026-10-30T16:00:00.000000Z' })
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(started, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const store = useConversationsStore()
    store.conversations = [makeSummary()]

    const conversation = await store.startConversation('I want to learn about running')

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/conversations`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(requestBody(fetchMock)).toEqual({ message: 'I want to learn about running' })
    expect(conversation.id).toBe(11)
    expect(store.conversations.map((summary) => summary.id)).toEqual([11, 10])
    expect(store.conversations[0]).not.toHaveProperty('messages')
  })

  it('starts a conversation about one of your topics', async () => {
    const fetchMock = stubApi({
      'POST /conversations': Response.json(makeConversation({ id: 11 }), { status: 201 }),
    })
    const store = useConversationsStore()

    await store.startConversation('Quiz me on photosynthesis', { topicId: 8 })

    expect(requestBody(fetchMock)).toEqual({ message: 'Quiz me on photosynthesis', topic_id: 8 })
  })

  it('sends material_ids only when there are files, in the order given', async () => {
    const fetchMock = stubApi({
      'POST /conversations': Response.json(makeConversation({ id: 11 }), { status: 201 }),
      'POST /conversations/11/messages': Response.json(makeConversation({ id: 11 }), {
        status: 201,
      }),
    })
    const store = useConversationsStore()

    await store.startConversation('Here are my notes', { materialIds: [9, 7] })
    await store.sendMessage(11, 'And one more', [12])
    await store.sendMessage(11, 'No files this time', [])

    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))
    expect(bodies).toEqual([
      { message: 'Here are my notes', material_ids: [9, 7] },
      { message: 'And one more', material_ids: [12] },
      { message: 'No files this time' },
    ])
  })

  it('sends a message and moves the conversation to the top of the history', async () => {
    const updated = makeConversation({ last_activity_at: '2026-10-30T17:00:00.000000Z' })
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(updated, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const store = useConversationsStore()
    store.conversations = [
      makeSummary({ id: 7, last_activity_at: '2026-10-30T16:00:00.000000Z' }),
      makeSummary(),
    ]

    await store.sendMessage(10, 'Mostly injuries')

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/conversations/10/messages`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(requestBody(fetchMock)).toEqual({ message: 'Mostly injuries' })
    expect(store.conversations.map((summary) => summary.id)).toEqual([10, 7])
    expect(store.conversation).toEqual(updated)
  })

  it('saves the reviewed draft and fetches the now read-only conversation', async () => {
    const reviewedDraft: ReviewedDraft = {
      title: 'Biomechanics of running',
      goal: { description: 'Explain the gait', deadline: '2026-12-01', recall_percentage: 80 },
      subtopics: [{ title: 'Gait cycle', content: 'Stance and swing phases.' }],
    }
    const saveResult = {
      topic: {
        id: 12,
        title: 'Biomechanics of running',
        goal: reviewedDraft.goal,
        subtopics: [{ id: 40, title: 'Gait cycle', generation_status: 'generating' }],
        created_at: '2026-10-30T15:20:11.000000Z',
      },
      added: { subtopics: 1 },
    }
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(saveResult, { status: 201 }))
      .mockResolvedValueOnce(Response.json(makeConversation({ is_saved: true })))
    vi.stubGlobal('fetch', fetchMock)
    const store = useConversationsStore()

    const result = await store.saveConversation(10, reviewedDraft)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${apiUrl}/conversations/10/save`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(requestBody(fetchMock)).toEqual(reviewedDraft)
    expect(result.added).toEqual({ subtopics: 1 })
    expect(result.topic.subtopics[0]?.generation_status).toBe('generating')
    expect(store.conversation?.is_saved).toBe(true)
    expect(store.conversations[0]?.is_saved).toBe(true)
  })

  it('lets a failed reply reach the caller', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json(
            { message: 'The tutor can’t answer right now. Try again in a moment.' },
            { status: 503 },
          ),
        ),
    )
    const store = useConversationsStore()

    await expect(store.startConversation('Hello')).rejects.toBeInstanceOf(ApiError)
    expect(store.conversations).toEqual([])
  })
})
