import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'
import {
  buildBlocks,
  emptyResult,
  scopeTitle,
  type BlockResult,
  type PracticeBlock,
  type PracticeMaterial,
  type PracticeOptions,
  type PracticeScope,
  type QuizOutcome,
} from '@/lib/practiceSession'
import type { Flashcard, Rating } from '@/stores/flashcards'
import type { Question } from '@/stores/questions'

/*
 * A practice session: the material of the scope you picked on the setup page, the plan of
 * blocks built from it, and what you did in each block (`../specs/practice-session.md`).
 * The API can't store practice yet, so results only live here, until you leave the session.
 */

/** In a block, between two blocks ("Next up"), or finished. */
export type SessionPhase = 'block' | 'next' | 'done'

export interface PracticePlan {
  scope: PracticeScope
  options: PracticeOptions
  /** "Photosynthesis" or "Biology · mixed subtopics". */
  title: string
  blocks: PracticeBlock[]
}

export const usePracticeStore = defineStore('practice', () => {
  const material = ref<PracticeMaterial>({ flashcards: [], questions: [] })
  const plan = ref<PracticePlan | null>(null)
  /** One per block of the plan. */
  const results = ref<BlockResult[]>([])
  const blockIndex = ref(0)
  const phase = ref<SessionPhase>('block')
  const startedAt = ref<Date | null>(null)
  const endedAt = ref<Date | null>(null)

  // Picking another scope while one is still loading: only the latest request may land.
  let latestRequest = 0

  /** Loads the cards and questions of the subtopics in scope, each subtopic in parallel. */
  async function loadMaterial(subtopicIds: number[]): Promise<void> {
    const request = ++latestRequest
    const perSubtopic = await Promise.all(
      subtopicIds.map((id) =>
        Promise.all([
          api<Flashcard[]>(`/subtopics/${id}/flashcards`),
          api<Question[]>(`/subtopics/${id}/questions`),
        ]),
      ),
    )
    if (request !== latestRequest) {
      return
    }

    material.value = {
      flashcards: perSubtopic.flatMap(([flashcards]) => flashcards),
      questions: perSubtopic.flatMap(([, questions]) => questions),
    }
  }

  const currentBlock = computed<PracticeBlock | null>(
    () => plan.value?.blocks[blockIndex.value] ?? null,
  )
  const currentResult = computed<BlockResult | null>(() => results.value[blockIndex.value] ?? null)
  const nextBlock = computed<PracticeBlock | null>(
    () => plan.value?.blocks[blockIndex.value + 1] ?? null,
  )

  /** Plans the session from the loaded material and opens its first block. */
  function start(scope: PracticeScope, options: PracticeOptions): void {
    const blocks = buildBlocks(scope, material.value, options)
    plan.value = { scope, options, title: scopeTitle(scope, options), blocks }
    results.value = blocks.map((block) => emptyResult(block.mode))
    blockIndex.value = 0
    phase.value = 'block'
    startedAt.value = new Date()
    endedAt.value = null
  }

  function record(update: (result: BlockResult) => void): void {
    const result = currentResult.value
    if (result === null) {
      return
    }
    result.status = 'started'
    update(result)
  }

  function rateCard(card: Flashcard, rating: Rating): void {
    record((result) => result.ratings.push({ card, rating }))
  }

  function answerQuestion(question: Question, outcome: QuizOutcome): void {
    record((result) => result.answers.push({ question, outcome }))
  }

  function addExplanation(text: string): void {
    record((result) => result.explanations.push(text))
  }

  function countMessage(): void {
    record((result) => (result.messagesSent += 1))
  }

  function end(): void {
    phase.value = 'done'
    endedAt.value = new Date()
  }

  // After a block: "Next up" when another block follows, otherwise the session is done.
  function advance(): void {
    if (nextBlock.value === null) {
      end()
      return
    }
    phase.value = 'next'
  }

  function finishBlock(): void {
    if (currentResult.value !== null) {
      currentResult.value.status = 'finished'
    }
    advance()
  }

  function skipBlock(): void {
    if (currentResult.value !== null) {
      currentResult.value.status = 'skipped'
    }
    advance()
  }

  /** From "Next up": open the block that follows. */
  function startNextBlock(): void {
    if (nextBlock.value === null) {
      return
    }
    blockIndex.value += 1
    phase.value = 'block'
  }

  /** From "Next up": skip the block that follows, and go on to the one after it. */
  function skipNextBlock(): void {
    if (nextBlock.value === null) {
      return
    }
    blockIndex.value += 1
    skipBlock()
  }

  function reset(): void {
    plan.value = null
    results.value = []
    blockIndex.value = 0
    phase.value = 'block'
    startedAt.value = null
    endedAt.value = null
  }

  return {
    material,
    plan,
    results,
    blockIndex,
    phase,
    startedAt,
    endedAt,
    currentBlock,
    currentResult,
    nextBlock,
    loadMaterial,
    start,
    rateCard,
    answerQuestion,
    addExplanation,
    countMessage,
    finishBlock,
    skipBlock,
    startNextBlock,
    skipNextBlock,
    end,
    reset,
  }
})
