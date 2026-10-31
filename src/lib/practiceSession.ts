/*
 * The practice session's rules: which modes a scope can run, which cards and questions a block
 * gets and in what order, and how a block's results read afterwards. Pure functions, so the
 * setup page, the session and the store share them and they're easy to test
 * (see `../specs/practice-session.md`).
 */
import type { BadgeTone } from '@/components/BaseBadge.vue'
import { practiceMode, practiceModes, type PracticeModeId } from '@/lib/practiceModes'
import type { Flashcard, Rating } from '@/stores/flashcards'
import type { Question, Verdict } from '@/stores/questions'
import type { Subtopic } from '@/stores/topics'

export interface PracticeScope {
  topicId: number
  topicTitle: string
  /** The one subtopic you picked, or null for the whole topic. */
  subtopic: Subtopic | null
  /** Every subtopic in scope, in the topic's order (just the one when you picked one). */
  subtopics: Subtopic[]
}

/** The cards and questions of every subtopic in scope. */
export interface PracticeMaterial {
  flashcards: Flashcard[]
  questions: Question[]
}

export interface PracticeOptions {
  modes: PracticeModeId[]
  cardCount: number
  questionCount: number
  /** Due cards and your weakest questions first; otherwise shuffled. */
  dueFirst: boolean
  /** For a whole topic: mix the subtopics instead of one subtopic at a time. */
  interleave: boolean
}

export interface ExplainConcept {
  subtopicId: number
  subtopicTitle: string
  prompt: string
  /** The backs of the subtopic's cards, to compare your explanation against. */
  keyPoints: string[]
}

export type PracticeBlock =
  | { mode: 'cards'; cards: Flashcard[] }
  | { mode: 'retrieval'; questions: Question[] }
  | { mode: 'feynman'; concept: ExplainConcept }
  | { mode: 'open'; topicId: number; topicTitle: string; subtopicTitle: string | null }

/** A number from 0 up to (not including) 1, like `Math.random`; tests pass their own. */
export type Random = () => number

// --- What a scope can run ------------------------------------------------------------------

function activeCards(material: PracticeMaterial): Flashcard[] {
  return material.flashcards.filter((card) => !card.paused)
}

function multipleChoice(material: PracticeMaterial): Question[] {
  return material.questions.filter((question) => question.type === 'multiple_choice')
}

/** Why a mode can't run on this scope, or null when it can. */
export function unavailableReason(
  mode: PracticeModeId,
  scope: PracticeScope,
  material: PracticeMaterial,
): string | null {
  switch (mode) {
    case 'cards':
      if (activeCards(material).length > 0) {
        return null
      }
      return material.flashcards.length > 0
        ? 'All cards here are paused.'
        : 'No flashcards here yet.'
    case 'retrieval':
      return multipleChoice(material).length > 0 ? null : 'No multiple-choice questions here yet.'
    case 'feynman':
      return scope.subtopics.length > 0 ? null : 'Add a subtopic first.'
    case 'open':
      return null
  }
}

export function availableModes(scope: PracticeScope, material: PracticeMaterial): PracticeModeId[] {
  return practiceModes
    .map((mode) => mode.id)
    .filter((mode) => unavailableReason(mode, scope, material) === null)
}

// --- Picking and ordering ------------------------------------------------------------------

function shuffled<Item>(items: Item[], random: Random): Item[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    const current = result[index] as Item
    result[index] = result[other] as Item
    result[other] = current
  }

  return result
}

/**
 * Puts the picked items in session order: one subtopic after the other (in the topic's order),
 * or taking turns between subtopics when interleaving. Within a subtopic the picked order stays.
 */
function arranged<Item extends { subtopic_id: number }>(
  items: Item[],
  subtopics: Subtopic[],
  interleave: boolean,
): Item[] {
  const groups = subtopics.map((subtopic) =>
    items.filter((item) => item.subtopic_id === subtopic.id),
  )

  if (!interleave) {
    return groups.flat()
  }

  const result: Item[] = []
  const longest = Math.max(0, ...groups.map((group) => group.length))
  for (let turn = 0; turn < longest; turn++) {
    for (const group of groups) {
      const item = group[turn]
      if (item !== undefined) {
        result.push(item)
      }
    }
  }

  return result
}

/** Due cards first (most overdue first), then the ones you're most likely to have forgotten. */
function byUrgency(first: Flashcard, second: Flashcard): number {
  if (first.is_due !== second.is_due) {
    return first.is_due ? -1 : 1
  }
  if (first.due_on !== second.due_on) {
    return first.due_on < second.due_on ? -1 : 1
  }

  return (first.recall ?? 0) - (second.recall ?? 0)
}

export function pickCards(
  material: PracticeMaterial,
  scope: PracticeScope,
  options: PracticeOptions,
  random: Random = Math.random,
): Flashcard[] {
  const cards = activeCards(material)
  const ordered = options.dueFirst ? [...cards].sort(byUrgency) : shuffled(cards, random)

  return arranged(ordered.slice(0, options.cardCount), scope.subtopics, options.interleave)
}

// Questions you haven't answered come first, then the ones you got wrong.
const verdictUrgency: Record<Verdict | 'unanswered', number> = {
  unanswered: 0,
  not_quite: 1,
  almost: 2,
  correct: 3,
}

function byWeakness(first: Question, second: Question): number {
  const firstUrgency = verdictUrgency[first.latest_answer?.verdict ?? 'unanswered']
  const secondUrgency = verdictUrgency[second.latest_answer?.verdict ?? 'unanswered']
  if (firstUrgency !== secondUrgency) {
    return firstUrgency - secondUrgency
  }

  // Answered longest ago first.
  const firstAnswered = first.latest_answer?.answered_at ?? ''
  const secondAnswered = second.latest_answer?.answered_at ?? ''

  return firstAnswered < secondAnswered ? -1 : firstAnswered > secondAnswered ? 1 : 0
}

/** Multiple choice only: open answers need grading by the API, which doesn't exist yet. */
export function pickQuestions(
  material: PracticeMaterial,
  scope: PracticeScope,
  options: PracticeOptions,
  random: Random = Math.random,
): Question[] {
  const questions = multipleChoice(material)
  const ordered = options.dueFirst ? [...questions].sort(byWeakness) : shuffled(questions, random)

  return arranged(ordered.slice(0, options.questionCount), scope.subtopics, options.interleave)
}

const keyPointLimit = 5

/** The subtopic you explain: the one you picked, or the one whose Explain it facet is weakest. */
export function pickConcept(scope: PracticeScope, material: PracticeMaterial): ExplainConcept {
  const subtopic =
    scope.subtopic ??
    [...scope.subtopics].sort(
      (first, second) =>
        (first.facets.explain.percent ?? -1) - (second.facets.explain.percent ?? -1),
    )[0]
  if (subtopic === undefined) {
    throw new Error('Explain it needs a subtopic')
  }

  const feynmanQuestion = material.questions.find(
    (question) => question.type === 'feynman' && question.subtopic_id === subtopic.id,
  )
  const keyPoints = activeCards(material)
    .filter((card) => card.subtopic_id === subtopic.id)
    .slice(0, keyPointLimit)
    .map((card) => card.back)

  return {
    subtopicId: subtopic.id,
    subtopicTitle: subtopic.title,
    prompt: feynmanQuestion?.prompt ?? `Explain ${subtopic.title} as if I’m 12.`,
    keyPoints,
  }
}

/** The session's blocks: the chosen modes that can run here, in the fixed order (open last). */
export function buildBlocks(
  scope: PracticeScope,
  material: PracticeMaterial,
  options: PracticeOptions,
  random: Random = Math.random,
): PracticeBlock[] {
  return availableModes(scope, material)
    .filter((mode) => options.modes.includes(mode))
    .map((mode): PracticeBlock => {
      switch (mode) {
        case 'cards':
          return { mode, cards: pickCards(material, scope, options, random) }
        case 'retrieval':
          return { mode, questions: pickQuestions(material, scope, options, random) }
        case 'feynman':
          return { mode, concept: pickConcept(scope, material) }
        case 'open':
          return {
            mode,
            topicId: scope.topicId,
            topicTitle: scope.topicTitle,
            subtopicTitle: scope.subtopic?.title ?? null,
          }
      }
    })
}

// --- How a session reads -------------------------------------------------------------------

function counted(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** "20 cards", "10 questions", "1 concept, 4 steps", "As long as you like". */
export function blockAmount(block: PracticeBlock): string {
  switch (block.mode) {
    case 'cards':
      return counted(block.cards.length, 'card', 'cards')
    case 'retrieval':
      return counted(block.questions.length, 'question', 'questions')
    case 'feynman':
      return '1 concept, 4 steps'
    case 'open':
      return 'As long as you like'
  }
}

function blockMinutes(block: PracticeBlock): number {
  const perItem = practiceMode(block.mode).minutes
  switch (block.mode) {
    case 'cards':
      return block.cards.length * perItem
    case 'retrieval':
      return block.questions.length * perItem
    case 'feynman':
    case 'open':
      return perItem
  }
}

export function estimateMinutes(blocks: PracticeBlock[]): number {
  const total = blocks.reduce((sum, block) => sum + blockMinutes(block), 0)

  return Math.max(1, Math.round(total))
}

/** "Photosynthesis", "Biology · all subtopics" or "Biology · mixed subtopics". */
export function scopeTitle(scope: PracticeScope, options: PracticeOptions): string {
  if (scope.subtopic !== null) {
    return scope.subtopic.title
  }

  return `${scope.topicTitle} · ${options.interleave ? 'mixed' : 'all'} subtopics`
}

// --- Results -------------------------------------------------------------------------------

/** `second_try`: wrong the first time, right the second. */
export type QuizOutcome = 'right' | 'second_try' | 'wrong'

export interface CardRating {
  card: Flashcard
  rating: Rating
}

export interface QuizAnswer {
  question: Question
  outcome: QuizOutcome
}

export type BlockStatus = 'not_started' | 'started' | 'finished' | 'skipped'

/** What you did in one block. Only the fields of the block's mode fill up. */
export interface BlockResult {
  mode: PracticeModeId
  status: BlockStatus
  /** Every rating in order; a card rated "Again" comes back and is rated again. */
  ratings: CardRating[]
  answers: QuizAnswer[]
  /** Your first and second explanation (Explain it). */
  explanations: string[]
  messagesSent: number
}

export function emptyResult(mode: PracticeModeId): BlockResult {
  return {
    mode,
    status: 'not_started',
    ratings: [],
    answers: [],
    explanations: [],
    messagesSent: 0,
  }
}

export interface CardsSummary {
  /** Cards rated at least once. */
  reviewed: number
  /** Cards whose first rating wasn't "Again". */
  fromMemory: number
  /** Cards rated "Again" at least once. */
  again: number
}

export function summariseCards(ratings: CardRating[]): CardsSummary {
  const firstRatings = new Map<number, Rating>()
  const againCards = new Set<number>()
  for (const { card, rating } of ratings) {
    if (!firstRatings.has(card.id)) {
      firstRatings.set(card.id, rating)
    }
    if (rating === 'again') {
      againCards.add(card.id)
    }
  }

  const fromMemory = [...firstRatings.values()].filter((rating) => rating !== 'again').length

  return { reviewed: firstRatings.size, fromMemory, again: againCards.size }
}

/** Cards in this block whose latest rating isn't "Again": they're done for this session. */
export function cardsDone(ratings: CardRating[]): number {
  const latest = new Map<number, Rating>()
  for (const { card, rating } of ratings) {
    latest.set(card.id, rating)
  }

  return [...latest.values()].filter((rating) => rating !== 'again').length
}

/**
 * You did everything the block planned: every card done, every question answered, both
 * explanations written, at least one message. Skipping a block on purpose counts as done.
 */
export function isBlockComplete(block: PracticeBlock, result: BlockResult): boolean {
  if (result.status === 'skipped') {
    return true
  }

  switch (block.mode) {
    case 'cards':
      return cardsDone(result.ratings) >= block.cards.length
    case 'retrieval':
      return result.answers.length >= block.questions.length
    case 'feynman':
      return result.explanations.length >= 2
    case 'open':
      return result.messagesSent > 0
  }
}

export interface QuizSummary {
  right: number
  secondTry: number
  wrong: number
}

export function summariseQuiz(answers: QuizAnswer[]): QuizSummary {
  return {
    right: answers.filter((answer) => answer.outcome === 'right').length,
    secondTry: answers.filter((answer) => answer.outcome === 'second_try').length,
    wrong: answers.filter((answer) => answer.outcome === 'wrong').length,
  }
}

/** One line on how a block went, for "Next up" and the Done screen. */
export function resultLine(result: BlockResult): string {
  if (result.status === 'skipped') {
    return 'Skipped'
  }

  switch (result.mode) {
    case 'cards': {
      const summary = summariseCards(result.ratings)
      return `${summary.fromMemory} of ${counted(summary.reviewed, 'card', 'cards')} from memory`
    }
    case 'retrieval': {
      const summary = summariseQuiz(result.answers)
      return `${summary.right} right · ${summary.secondTry} on the second try · ${summary.wrong} wrong`
    }
    case 'feynman':
      return result.explanations.length > 0 ? 'Explained in your own words' : 'Not explained yet'
    case 'open':
      return `${counted(result.messagesSent, 'message', 'messages')} with the tutor`
  }
}

export interface SlippedItem {
  key: string
  title: string
  grade: string
  tone: BadgeTone
}

const ratingOrder: Rating[] = ['again', 'hard', 'good', 'easy']

/** Cards whose worst rating was "Again" or "Hard", and questions you didn't get right at once. */
export function slippedItems(results: BlockResult[]): SlippedItem[] {
  const worstRatings = new Map<number, CardRating>()
  for (const result of results) {
    for (const entry of result.ratings) {
      const worst = worstRatings.get(entry.card.id)
      if (
        worst === undefined ||
        ratingOrder.indexOf(entry.rating) < ratingOrder.indexOf(worst.rating)
      ) {
        worstRatings.set(entry.card.id, entry)
      }
    }
  }

  const cards = [...worstRatings.values()]
    .filter(({ rating }) => rating === 'again' || rating === 'hard')
    .map(({ card, rating }): SlippedItem => ({
      key: `card-${card.id}`,
      title: card.front,
      grade: rating === 'again' ? 'Again' : 'Hard',
      tone: rating === 'again' ? 'ember' : 'sun',
    }))

  const questions = results
    .flatMap((result) => result.answers)
    .filter(({ outcome }) => outcome !== 'right')
    .map(({ question, outcome }): SlippedItem => ({
      key: `question-${question.id}`,
      title: question.prompt,
      grade: outcome === 'wrong' ? 'Not quite' : 'Second try',
      tone: outcome === 'wrong' ? 'ember' : 'sun',
    }))

  return [...cards, ...questions]
}
