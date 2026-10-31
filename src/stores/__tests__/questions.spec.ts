import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { makeOpenQuestion, makeQuestion } from '@/__tests__/materialFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { useQuestionsStore } from '../questions'

describe('questions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("fetches a subtopic's questions and deletes one", async () => {
    stubApi({
      'GET /subtopics/101/questions': Response.json([makeQuestion(), makeOpenQuestion()]),
      'DELETE /questions/17': new Response(null, { status: 204 }),
    })
    const store = useQuestionsStore()

    await store.fetchQuestions(101)
    expect(store.questions).toHaveLength(2)

    await store.deleteQuestion(17)
    expect(store.questions.map((question) => question.id)).toEqual([18])
  })
})
