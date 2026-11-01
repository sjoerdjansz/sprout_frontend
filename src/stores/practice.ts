import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, api } from '@/lib/api'
import type { PracticeModeId } from '@/lib/practiceModes'
import {
  blocksFromPlan,
  buildBlocks,
  builtInDefaults,
  defaultsFromSettings,
  emptyResult,
  resultsFromDone,
  resumeIndex,
  scopeTitle,
  sessionPlan,
  type BlockResult,
  type PracticeBlock,
  type PracticeMaterial,
  type PracticeOptions,
  type PracticeScope,
} from '@/lib/practiceSession'
import type { Technique } from '@/lib/techniques'
import type { Flashcard, Rating } from '@/stores/flashcards'
import type { Gap, Question, Verdict } from '@/stores/questions'
import { useSettingsStore } from '@/stores/settings'
import { useTopicsStore, type Subtopic } from '@/stores/topics'

/*
 * A practice session (`../specs/practice-session.md`): the material of the scope you picked on
 * the setup page, the plan of blocks built from it, and what you did in each block. Every
 * rating, answer, explanation and message is saved the moment it happens (`../API.md`,
 * "Practice" and "Practice sessions"), so a reload can pick the session up again.
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

// --- API shapes (`../API.md`, "Practice" and "Practice sessions") ---------------------------

/** The plan as the API keeps it, so a reload can rebuild the blocks. */
export interface PracticeSessionPlan {
  modes: PracticeModeId[]
  card_ids: number[]
  question_ids: number[]
  explain_subtopic_id: number | null
}

export interface PracticeMessage {
  id: number
  role: 'user' | 'tutor'
  content: string
  /** The learning technique the tutor's turn applies; null on yours. */
  technique: Technique | null
  created_at: string
}

/** Everything sent with the session, oldest first. */
export interface PracticeSessionDone {
  flashcard_reviews: { flashcard_id: number; rating: Rating; reviewed_at: string }[]
  /** A wrong first pick has `score: null`; its second try follows. */
  answers: {
    question_id: number
    option_id: number | null
    score: number | null
    verdict: Verdict
    answered_at: string
  }[]
  /** Version 2 has no score or verdict. */
  explanations: {
    question_id: number
    version: 1 | 2
    score: number | null
    verdict: Verdict | null
    answered_at: string
  }[]
  messages: PracticeMessage[]
  message_count: number
}

export interface PracticedSubtopic {
  id: number
  title: string
  mastery_before: number
  mastery_after: number
  /** YYYY-MM-DD, or null without cards to review. */
  next_review_on: string | null
}

export interface PracticeSession {
  id: number
  topic: { id: number; title: string }
  /** Null for a session on the whole topic. */
  subtopic: { id: number; title: string } | null
  plan: PracticeSessionPlan
  started_at: string
  ended_at: string | null
  last_activity_at: string
  is_finished: boolean
  done: PracticeSessionDone
  xp_earned: number
  streak_days: number
  subtopics: PracticedSubtopic[]
}

/** An answer as the API checked it, in the shape of `latest_answer`. */
export interface CheckedAnswer {
  response: string | null
  option_id: number | null
  /** Null for a wrong first pick and for a simpler second explanation. */
  score: number | null
  verdict: Verdict | null
  feedback: string | null
  gaps: Gap[] | null
  answered_at: string
}

interface ReviewedFlashcard {
  flashcard: Flashcard
  subtopic: Subtopic | null
}

export interface AnsweredQuestion {
  answer: CheckedAnswer
  /** A wrong first pick: show the nudge and send the second pick with `second_try`. */
  try_again: boolean
  subtopic: Subtopic | null
}

/** What you answer: an option, a typed answer, or "I don't know". */
export interface AnswerInput {
  option_id?: number
  response?: string
  second_try?: boolean
  dont_know?: boolean
}

interface CheckedExplanation {
  question: { id: number; prompt: string }
  answer: CheckedAnswer
  subtopic: Subtopic | null
}

interface SentMessage {
  message: PracticeMessage
  reply: PracticeMessage
}

export const usePracticeStore = defineStore('practice', () => {
  const material = ref<PracticeMaterial>({ flashcards: [], questions: [] })
  const plan = ref<PracticePlan | null>(null)
  /** One per block of the plan. */
  const results = ref<BlockResult[]>([])
  const blockIndex = ref(0)
  const phase = ref<SessionPhase>('block')
  /** The session as the API keeps it; after finishing, its results. Null once nothing was practised. */
  const session = ref<PracticeSession | null>(null)
  /** The session still going today, for "Pick up where you left off" on the setup page. */
  const current = ref<PracticeSession | null>(null)
  /** The Sessions tab of the subtopic page. */
  const subtopicSessions = ref<PracticeSession[]>([])

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

  function sessionId(): number {
    if (session.value === null) {
      throw new Error('There is no practice session going')
    }

    return session.value.id
  }

  /** Plans the session from the loaded material, starts it on the API and opens its first block. */
  async function start(scope: PracticeScope, options: PracticeOptions): Promise<void> {
    const blocks = buildBlocks(scope, material.value, options)
    session.value = await api<PracticeSession>('/practice-sessions', {
      method: 'POST',
      body: {
        topic_id: scope.topicId,
        subtopic_id: scope.subtopic?.id ?? null,
        ...sessionPlan(blocks),
      },
    })
    current.value = null

    plan.value = { scope, options, title: scopeTitle(scope, options), blocks }
    results.value = blocks.map((block) => emptyResult(block.mode))
    blockIndex.value = 0
    phase.value = 'block'
  }

  /** The session still going today, or null when there's nothing to pick up. */
  async function fetchCurrent(): Promise<PracticeSession | null> {
    current.value = await api<PracticeSession | null>('/practice-sessions/current')

    return current.value
  }

  // The plan doesn't keep the second try and interleaving, so they come from your settings.
  // Practice works without them, like on the setup page.
  async function resumeOptions(modes: PracticeModeId[]): Promise<PracticeOptions> {
    const settingsStore = useSettingsStore()
    let defaults = builtInDefaults
    try {
      defaults = defaultsFromSettings(
        settingsStore.settings ?? (await settingsStore.fetchSettings()),
      )
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
    }

    return { ...defaults, modes, dueFirst: true }
  }

  /**
   * Picks up the session still going today (after a reload): its scope and material, the blocks
   * from its plan and what you did in them. False when there's nothing to pick up.
   */
  async function resume(): Promise<boolean> {
    const found = await fetchCurrent()
    if (found === null) {
      return false
    }

    const topicsStore = useTopicsStore()
    await topicsStore.fetchLibrary()
    const topic = topicsStore.topics.find((each) => each.id === found.topic.id)
    if (topic === undefined) {
      return false
    }
    const subtopic = topic.subtopics.find((each) => each.id === found.subtopic?.id) ?? null
    const scope: PracticeScope = {
      topicId: topic.id,
      topicTitle: topic.title,
      subtopic,
      subtopics: subtopic === null ? topic.subtopics : [subtopic],
    }

    const [options] = await Promise.all([
      resumeOptions(found.plan.modes),
      loadMaterial(scope.subtopics.map((each) => each.id)),
    ])
    const blocks = blocksFromPlan(found.plan, scope, material.value)

    session.value = found
    plan.value = { scope, options, title: scopeTitle(scope, options), blocks }
    results.value = resultsFromDone(blocks, found.done, material.value)
    const index = resumeIndex(blocks, results.value)
    blockIndex.value = index ?? Math.max(0, blocks.length - 1)
    phase.value = 'block'
    // Everything was done before the reload; only finishing it was left.
    if (index === null) {
      await end()
    }

    return true
  }

  function record(update: (result: BlockResult) => void): void {
    const result = currentResult.value
    if (result === null) {
      return
    }
    result.status = 'started'
    update(result)
  }

  /** Saves a rating; the card comes back with its new schedule. */
  async function rateCard(card: Flashcard, rating: Rating): Promise<Flashcard> {
    const reviewed = await api<ReviewedFlashcard>(`/flashcards/${card.id}/reviews`, {
      method: 'POST',
      body: { rating, practice_session_id: sessionId() },
    })
    record((result) => result.ratings.push({ card: reviewed.flashcard, rating }))

    return reviewed.flashcard
  }

  /** Saves and checks an answer. Only a graded answer counts; a wrong first pick gets another try. */
  async function answerQuestion(question: Question, input: AnswerInput): Promise<AnsweredQuestion> {
    const answered = await api<AnsweredQuestion>(`/questions/${question.id}/answers`, {
      method: 'POST',
      body: { ...input, practice_session_id: sessionId() },
    })
    const verdict = answered.answer.verdict
    if (answered.answer.score !== null && verdict !== null) {
      record((result) => result.answers.push({ question, outcome: verdict }))
    }

    return answered
  }

  /** Saves an explanation (1: the first, 2: the simpler one) and returns what Sprout found. */
  async function explain(
    subtopicId: number,
    explanation: string,
    version: 1 | 2,
  ): Promise<CheckedAnswer> {
    const checked = await api<CheckedExplanation>(`/subtopics/${subtopicId}/explanations`, {
      method: 'POST',
      body: { explanation, version, practice_session_id: sessionId() },
    })
    record((result) =>
      result.explanations.push({
        version,
        text: explanation,
        feedback: checked.answer.feedback,
        gaps: checked.answer.gaps ?? [],
      }),
    )

    return checked.answer
  }

  /** The open session: your message and the tutor's reply. */
  async function sendMessage(message: string): Promise<void> {
    const sent = await api<SentMessage>(`/practice-sessions/${sessionId()}/messages`, {
      method: 'POST',
      body: { message },
    })
    record((result) => result.messages.push(sent.message, sent.reply))
  }

  /** Finishes the session on the API; its answer has the results for Done (null: nothing practised). */
  async function end(): Promise<void> {
    session.value = await api<PracticeSession | null>(`/practice-sessions/${sessionId()}/finish`, {
      method: 'POST',
    })
    phase.value = 'done'
  }

  // After a block: "Next up" when another block follows, otherwise the session is done.
  async function advance(): Promise<void> {
    if (nextBlock.value === null) {
      await end()
      return
    }
    phase.value = 'next'
  }

  async function finishBlock(): Promise<void> {
    if (currentResult.value !== null) {
      currentResult.value.status = 'finished'
    }
    await advance()
  }

  async function skipBlock(): Promise<void> {
    if (currentResult.value !== null) {
      currentResult.value.status = 'skipped'
    }
    await advance()
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
  async function skipNextBlock(): Promise<void> {
    if (nextBlock.value === null) {
      return
    }
    blockIndex.value += 1
    await skipBlock()
  }

  /** Practice sessions in which this subtopic was practised, latest first. */
  async function fetchSubtopicSessions(subtopicId: number): Promise<void> {
    subtopicSessions.value = await api<PracticeSession[]>(
      `/subtopics/${subtopicId}/practice-sessions`,
    )
  }

  /** Clears the page's copy; a session that's still going stays on the API to pick up again. */
  /** A deleted topic took its practice sessions with it on the API; drop them here too. */
  function forgetTopic(topicId: number): void {
    if (current.value?.topic.id === topicId) {
      current.value = null
    }
    if (session.value?.topic.id === topicId) {
      reset()
    }
  }

  function reset(): void {
    plan.value = null
    results.value = []
    blockIndex.value = 0
    phase.value = 'block'
    session.value = null
  }

  return {
    material,
    plan,
    results,
    blockIndex,
    phase,
    session,
    current,
    subtopicSessions,
    currentBlock,
    currentResult,
    nextBlock,
    loadMaterial,
    start,
    fetchCurrent,
    resume,
    rateCard,
    answerQuestion,
    explain,
    sendMessage,
    finishBlock,
    skipBlock,
    startNextBlock,
    skipNextBlock,
    end,
    fetchSubtopicSessions,
    reset,
    forgetTopic,
  }
})
