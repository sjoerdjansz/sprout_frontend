import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { makeFlashcard, makeQuestion } from '@/__tests__/materialFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeSubtopic } from '@/__tests__/topicFixtures'
import type { PracticeOptions, PracticeScope } from '@/lib/practiceSession'
import { usePracticeStore } from '../practice'

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

  it('runs the blocks one after the other, with "next up" in between', () => {
    const store = usePracticeStore()
    store.material = { flashcards: [makeFlashcard()], questions: [makeQuestion()] }

    store.start(scope, options())
    expect(store.plan?.title).toBe('Photosynthesis')
    expect(store.currentBlock?.mode).toBe('cards')

    store.rateCard(makeFlashcard(), 'good')
    store.finishBlock()
    expect(store.phase).toBe('next')
    expect(store.nextBlock?.mode).toBe('retrieval')

    store.startNextBlock()
    expect(store.phase).toBe('block')
    expect(store.currentBlock?.mode).toBe('retrieval')

    store.answerQuestion(makeQuestion(), 'right')
    store.finishBlock()
    expect(store.phase).toBe('done')
    expect(store.results.map((result) => result.status)).toEqual(['finished', 'finished'])
    expect(store.endedAt).not.toBeNull()
  })

  it('skips the next block from "next up"', () => {
    const store = usePracticeStore()
    store.material = { flashcards: [makeFlashcard()], questions: [makeQuestion()] }
    store.start(scope, options({ modes: ['cards', 'retrieval', 'open'] }))

    store.finishBlock()
    store.skipNextBlock()

    expect(store.results.map((result) => result.status)).toEqual([
      'finished',
      'skipped',
      'not_started',
    ])
    expect(store.phase).toBe('next')
    expect(store.nextBlock?.mode).toBe('open')
  })

  it('ends early and keeps what you did so far', () => {
    const store = usePracticeStore()
    store.material = { flashcards: [makeFlashcard()], questions: [makeQuestion()] }
    store.start(scope, options())

    store.rateCard(makeFlashcard(), 'again')
    store.end()

    expect(store.phase).toBe('done')
    expect(store.results[0]?.status).toBe('started')
    expect(store.results[0]?.ratings).toHaveLength(1)
  })
})
