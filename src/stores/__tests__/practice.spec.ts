import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { makeFlashcard, makeQuestion } from '@/__tests__/materialFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeDone, makePracticeSession } from '@/__tests__/practiceFixtures'
import { makeSettings } from '@/__tests__/settingsFixtures'
import { makeCategories, makeLibrary, makeSubtopic } from '@/__tests__/topicFixtures'
import type { PracticeOptions, PracticeScope } from '@/lib/practiceSession'
import { usePracticeStore, type CheckedAnswer } from '../practice'

const answer: CheckedAnswer = {
  response: null,
  option_id: 61,
  score: null,
  verdict: null,
  feedback: null,
  gaps: null,
  answered_at: '2026-10-31T09:00:00.000000Z',
}

function requestBody(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, call = 0): unknown {
  return JSON.parse(String(fetchMock.mock.calls[call]?.[1]?.body))
}

const photosynthesis = makeSubtopic()

const scope: PracticeScope = {
  topicId: 1,
  topicTitle: 'Biology',
  subtopic: photosynthesis,
  subtopics: [photosynthesis],
}

function options(overrides: Partial<PracticeOptions> = {}): PracticeOptions {
  return {
    modes: ['cards', 'retrieval'],
    cardCount: 20,
    questionCount: 10,
    dueFirst: true,
    interleave: false,
    secondTry: true,
    ...overrides,
  }
}

describe('practice store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the cards and questions of every subtopic in scope', async () => {
    stubApi({
      'GET /subtopics/101/flashcards': Response.json([makeFlashcard({ id: 1 })]),
      'GET /subtopics/101/questions': Response.json([makeQuestion({ id: 5 })]),
      'GET /subtopics/102/flashcards': Response.json([makeFlashcard({ id: 2, subtopic_id: 102 })]),
      'GET /subtopics/102/questions': Response.json([]),
    })
    const store = usePracticeStore()

    await store.loadMaterial([101, 102])

    expect(store.material.flashcards.map((card) => card.id)).toEqual([1, 2])
    expect(store.material.questions.map((question) => question.id)).toEqual([5])
  })

  it('keeps only the latest scope when an earlier one answers late', async () => {
    let answerFirst: (response: Response) => void = () => {}
    stubApi({
      'GET /subtopics/101/flashcards': () =>
        new Promise<Response>((resolve) => (answerFirst = resolve)),
      'GET /subtopics/101/questions': Response.json([]),
      'GET /subtopics/102/flashcards': Response.json([makeFlashcard({ id: 2, subtopic_id: 102 })]),
      'GET /subtopics/102/questions': Response.json([]),
    })
    const store = usePracticeStore()

    const first = store.loadMaterial([101])
    await store.loadMaterial([102])
    answerFirst(Response.json([makeFlashcard({ id: 1 })]))
    await first

    expect(store.material.flashcards.map((card) => card.id)).toEqual([2])
  })

  it('starts the session on the API with the plan in block order', async () => {
    const fetchMock = stubApi({ 'POST /practice-sessions': Response.json(makePracticeSession()) })
    const store = usePracticeStore()
    store.material = { flashcards: [makeFlashcard()], questions: [makeQuestion()] }

    await store.start(scope, options())

    expect(requestBody(fetchMock)).toEqual({
      topic_id: 1,
      subtopic_id: 101,
      modes: ['cards', 'retrieval'],
      card_ids: [41],
      question_ids: [17],
      explain_subtopic_id: null,
    })
    expect(store.plan?.title).toBe('Photosynthesis')
    expect(store.currentBlock?.mode).toBe('cards')
  })

  it('saves practice with the session’s id and runs the blocks with "next up" in between', async () => {
    const finished = makePracticeSession({ is_finished: true, xp_earned: 3 })
    const fetchMock = stubApi({
      'POST /practice-sessions': Response.json(makePracticeSession()),
      'POST /flashcards/41/reviews': Response.json({
        flashcard: makeFlashcard({ last_rating: 'good' }),
        subtopic: photosynthesis,
      }),
      'POST /questions/17/answers': Response.json({
        answer: { ...answer, score: 100, verdict: 'correct' },
        try_again: false,
        subtopic: photosynthesis,
      }),
      'POST /practice-sessions/52/finish': Response.json(finished),
    })
    const store = usePracticeStore()
    store.material = { flashcards: [makeFlashcard()], questions: [makeQuestion()] }
    await store.start(scope, options())

    await store.rateCard(makeFlashcard(), 'good')
    expect(requestBody(fetchMock, 1)).toEqual({ rating: 'good', practice_session_id: 52 })
    await store.finishBlock()
    expect(store.phase).toBe('next')
    expect(store.nextBlock?.mode).toBe('retrieval')

    store.startNextBlock()
    await store.answerQuestion(makeQuestion(), { option_id: 61 })
    expect(requestBody(fetchMock, 2)).toEqual({ option_id: 61, practice_session_id: 52 })
    await store.finishBlock()

    expect(store.phase).toBe('done')
    expect(store.session).toEqual(finished)
    expect(store.results.map((result) => result.status)).toEqual(['finished', 'finished'])
    expect(store.results[1]?.answers[0]?.outcome).toBe('correct')
  })

  it('doesn’t count a wrong first pick that gets another try', async () => {
    stubApi({
      'POST /practice-sessions': Response.json(makePracticeSession()),
      'POST /questions/17/answers': Response.json({
        answer: { ...answer, option_id: 60, score: null, verdict: 'not_quite' },
        try_again: true,
        subtopic: null,
      }),
    })
    const store = usePracticeStore()
    store.material = { flashcards: [], questions: [makeQuestion()] }
    await store.start(scope, options({ modes: ['retrieval'] }))

    const answered = await store.answerQuestion(makeQuestion(), { option_id: 60 })

    expect(answered.try_again).toBe(true)
    expect(store.currentResult?.answers).toEqual([])
  })

  it('says nothing was practised when finishing deletes the session', async () => {
    stubApi({
      'POST /practice-sessions': Response.json(makePracticeSession()),
      'POST /practice-sessions/52/finish': new Response(null, { status: 204 }),
    })
    const store = usePracticeStore()
    store.material = { flashcards: [makeFlashcard()], questions: [] }
    await store.start(scope, options({ modes: ['cards'] }))

    await store.end()

    expect(store.phase).toBe('done')
    expect(store.session).toBeNull()
  })

  it('skips the next block from "next up"', async () => {
    stubApi({ 'POST /practice-sessions': Response.json(makePracticeSession()) })
    const store = usePracticeStore()
    store.material = { flashcards: [makeFlashcard()], questions: [makeQuestion()] }
    await store.start(scope, options({ modes: ['cards', 'retrieval', 'open'] }))

    await store.finishBlock()
    await store.skipNextBlock()

    expect(store.results.map((result) => result.status)).toEqual([
      'finished',
      'skipped',
      'not_started',
    ])
    expect(store.phase).toBe('next')
    expect(store.nextBlock?.mode).toBe('open')
  })

  it('picks up today’s session where you left off', async () => {
    const library = makeLibrary()
    stubApi({
      'GET /practice-sessions/current': Response.json(
        makePracticeSession({
          plan: {
            modes: ['cards', 'open'],
            card_ids: [41],
            question_ids: [],
            explain_subtopic_id: null,
          },
          done: makeDone({
            flashcard_reviews: [{ flashcard_id: 41, rating: 'good', reviewed_at: '' }],
          }),
        }),
      ),
      'GET /topics': Response.json(library),
      'GET /categories': Response.json(makeCategories()),
      'GET /settings': Response.json(makeSettings()),
      'GET /subtopics/101/flashcards': Response.json([makeFlashcard()]),
      'GET /subtopics/101/questions': Response.json([]),
    })
    const store = usePracticeStore()

    expect(await store.resume()).toBe(true)

    expect(store.plan?.title).toBe('Photosynthesis')
    expect(store.plan?.blocks.map((block) => block.mode)).toEqual(['cards', 'open'])
    expect(store.results[0]?.ratings).toHaveLength(1)
    // Every card is rated, so it goes on with the open session.
    expect(store.blockIndex).toBe(1)
    expect(store.phase).toBe('block')
  })

  it('has nothing to pick up when no session is going today', async () => {
    stubApi({ 'GET /practice-sessions/current': new Response(null, { status: 204 }) })
    const store = usePracticeStore()

    expect(await store.resume()).toBe(false)
    expect(store.plan).toBeNull()
  })

  it('lists the practice sessions of a subtopic', async () => {
    stubApi({ 'GET /subtopics/101/practice-sessions': Response.json([makePracticeSession()]) })
    const store = usePracticeStore()

    await store.fetchSubtopicSessions(101)

    expect(store.subtopicSessions.map((session) => session.id)).toEqual([52])
  })
})
