/*
 * The practice session's rules: which modes a scope can run, which cards and questions a block
 * gets and in what order, and how a block's results read afterwards. Pure functions, so the
 * setup page, the session and the store share them and they're easy to test
 * (see `../specs/practice-session.md`).
 */
import type { BadgeTone } from '@/components/BaseBadge.vue'
import { practiceMode, practiceModes, type PracticeModeId } from '@/lib/practiceModes'
import { ratingLabels } from '@/lib/ratings'
import type { Flashcard, Rating } from '@/stores/flashcards'
import type {
  PracticeMessage,
  PracticeSession,
  PracticeSessionDone,
  PracticeSessionPlan,
} from '@/stores/practice'
import type { Gap, Question, Verdict } from '@/stores/questions'
import type { Settings } from '@/stores/settings'
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
  /** In the quiz, a wrong first pick gets a nudge and a second try before the answer. */
  secondTry: boolean
}

/** What a new session starts from when you haven't set your learning defaults (or they can't load). */
export const builtInDefaults: Omit<PracticeOptions, 'modes' | 'dueFirst'> = {
  cardCount: practiceMode('cards').defaultSize,
  questionCount: practiceMode('retrieval').defaultSize,
  interleave: true,
  secondTry: true,
}

/**
 * Your learning defaults from settings as session options. The session size counts cards; the
 * quiz takes the same step on its own, smaller sizes (10, 20, 40 cards → 5, 10, 20 questions),
 * since a question takes longer than a card.
 */
export function defaultsFromSettings(
  settings: Pick<Settings, 'session_size' | 'interleave_subtopics' | 'hint_before_answer'>,
): Omit<PracticeOptions, 'modes' | 'dueFirst'> {
  const step = practiceMode('cards').sizes.indexOf(settings.session_size)
  const cardCount = step === -1 ? builtInDefaults.cardCount : settings.session_size
  const questionCount = practiceMode('retrieval').sizes[step] ?? builtInDefaults.questionCount

  return {
    cardCount,
    questionCount,
    interleave: settings.interleave_subtopics,
    secondTry: settings.hint_before_answer,
  }
}

export interface ExplainConcept {
  subtopicId: number
  subtopicTitle: string
  prompt: string
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

// Explain it questions have a block of their own.
function quizQuestions(material: PracticeMaterial): Question[] {
  return material.questions.filter((question) => question.type !== 'feynman')
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
      return quizQuestions(material).length > 0 ? null : 'No quiz questions here yet.'
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

/**
 * What "Mix it all" turns on: every mode that can run except the open session, which has no
 * end, so you add it to a mix yourself.
 */
export function mixableModes(available: PracticeModeId[]): PracticeModeId[] {
  return available.filter((mode) => mode !== 'open')
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

/** Multiple choice and open questions; Sprout checks the open answers. */
export function pickQuestions(
  material: PracticeMaterial,
  scope: PracticeScope,
  options: PracticeOptions,
  random: Random = Math.random,
): Question[] {
  const questions = quizQuestions(material)
  const ordered = options.dueFirst ? [...questions].sort(byWeakness) : shuffled(questions, random)

  return arranged(ordered.slice(0, options.questionCount), scope.subtopics, options.interleave)
}

/**
 * Explaining one subtopic. The prompt is its first Explain it question, the one the API files
 * the explanation under; without one the API makes this same question.
 */
function conceptFor(subtopic: Subtopic, material: PracticeMaterial): ExplainConcept {
  const feynmanQuestion = material.questions.find(
    (question) => question.type === 'feynman' && question.subtopic_id === subtopic.id,
  )

  return {
    subtopicId: subtopic.id,
    subtopicTitle: subtopic.title,
    prompt: feynmanQuestion?.prompt ?? `Explain ${subtopic.title} as if I’m 12.`,
  }
}

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

  return conceptFor(subtopic, material)
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

/** The plan as the API keeps it: the modes and the ids in block order. */
export function sessionPlan(blocks: PracticeBlock[]): PracticeSessionPlan {
  const plan: PracticeSessionPlan = {
    modes: blocks.map((block) => block.mode),
    card_ids: [],
    question_ids: [],
    explain_subtopic_id: null,
  }
  for (const block of blocks) {
    if (block.mode === 'cards') {
      plan.card_ids = block.cards.map((card) => card.id)
    } else if (block.mode === 'retrieval') {
      plan.question_ids = block.questions.map((question) => question.id)
    } else if (block.mode === 'feynman') {
      plan.explain_subtopic_id = block.concept.subtopicId
    }
  }

  return plan
}

/**
 * The blocks of a session you pick up again, from the plan it was started with. A card or
 * question deleted since is left out.
 */
export function blocksFromPlan(
  plan: PracticeSessionPlan,
  scope: PracticeScope,
  material: PracticeMaterial,
): PracticeBlock[] {
  return plan.modes.flatMap((mode): PracticeBlock[] => {
    switch (mode) {
      case 'cards':
        return [
          {
            mode,
            cards: plan.card_ids.flatMap((id) =>
              material.flashcards.filter((card) => card.id === id),
            ),
          },
        ]
      case 'retrieval':
        return [
          {
            mode,
            questions: plan.question_ids.flatMap((id) =>
              material.questions.filter((question) => question.id === id),
            ),
          },
        ]
      case 'feynman': {
        const subtopic =
          scope.subtopics.find((each) => each.id === plan.explain_subtopic_id) ?? scope.subtopics[0]
        return subtopic === undefined ? [] : [{ mode, concept: conceptFor(subtopic, material) }]
      }
      case 'open':
        return [
          {
            mode,
            topicId: scope.topicId,
            topicTitle: scope.topicTitle,
            subtopicTitle: scope.subtopic?.title ?? null,
          },
        ]
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

/**
 * How a question ended, as the API grades it. Right on the second try is `almost`, like an
 * open answer that's nearly there.
 */
export type QuizOutcome = Verdict

export interface CardRating {
  card: Flashcard
  rating: Rating
}

export interface QuizAnswer {
  question: Question
  outcome: QuizOutcome
}

export type BlockStatus = 'not_started' | 'started' | 'finished' | 'skipped'

/** One version of your explanation and what Sprout said about it. */
export interface Explanation {
  version: 1 | 2
  text: string
  feedback: string | null
  gaps: Gap[]
}

/** What you did in one block. Only the fields of the block's mode fill up. */
export interface BlockResult {
  mode: PracticeModeId
  status: BlockStatus
  /** Every rating in order; a card rated "Again" comes back and is rated again. */
  ratings: CardRating[]
  answers: QuizAnswer[]
  /** Your first and simpler explanation (Explain it). */
  explanations: Explanation[]
  /** The open session's chat: yours and the tutor's. */
  messages: PracticeMessage[]
}

export function emptyResult(mode: PracticeModeId): BlockResult {
  return {
    mode,
    status: 'not_started',
    ratings: [],
    answers: [],
    explanations: [],
    messages: [],
  }
}

/**
 * What you already did in each block of a session you pick up again, from the practice the API
 * kept. Your first explanation comes back from its question's latest answer; what was skipped
 * isn't kept, so a skipped block is offered again.
 */
export function resultsFromDone(
  blocks: PracticeBlock[],
  done: PracticeSessionDone,
  material: PracticeMaterial,
): BlockResult[] {
  return blocks.map((block) => {
    const result = emptyResult(block.mode)
    switch (block.mode) {
      case 'cards':
        result.ratings = done.flashcard_reviews.flatMap((review) =>
          block.cards
            .filter((card) => card.id === review.flashcard_id)
            .map((card) => ({ card, rating: review.rating })),
        )
        break
      case 'retrieval':
        result.answers = done.answers.flatMap((answer) =>
          answer.score === null
            ? []
            : block.questions
                .filter((question) => question.id === answer.question_id)
                .map((question) => ({ question, outcome: answer.verdict })),
        )
        break
      case 'feynman':
        result.explanations = done.explanations.map((explanation): Explanation => {
          const latest = material.questions.find(
            (question) => question.id === explanation.question_id,
          )?.latest_answer
          const first = explanation.version === 1 ? latest : undefined
          return {
            version: explanation.version,
            text: first?.response ?? '',
            feedback: first?.feedback ?? null,
            gaps: first?.gaps ?? [],
          }
        })
        break
      case 'open':
        result.messages = [...done.messages]
        break
    }

    const practised =
      result.ratings.length +
      result.answers.length +
      result.explanations.length +
      result.messages.length
    result.status = practised > 0 ? 'started' : 'not_started'

    return result
  })
}

/**
 * Where a session you pick up again goes on: the first block that isn't done, or null when
 * everything is. The open session has no end, so it's never done until you wrap it up.
 */
export function resumeIndex(blocks: PracticeBlock[], results: BlockResult[]): number | null {
  const index = blocks.findIndex((block, each) => {
    const result = results[each]
    return block.mode === 'open' || result === undefined || !isBlockComplete(block, result)
  })

  return index === -1 ? null : index
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
      return result.explanations.some((explanation) => explanation.version === 2)
    case 'open':
      return result.messages.length > 0
  }
}

export interface QuizSummary {
  right: number
  /** Right on the second try, or an open answer that's nearly there. */
  almost: number
  wrong: number
}

export function summariseQuiz(answers: QuizAnswer[]): QuizSummary {
  return {
    right: answers.filter((answer) => answer.outcome === 'correct').length,
    almost: answers.filter((answer) => answer.outcome === 'almost').length,
    wrong: answers.filter((answer) => answer.outcome === 'not_quite').length,
  }
}

/** Your messages to the tutor in an open session. */
export function messagesSent(result: BlockResult): number {
  return result.messages.filter((message) => message.role === 'user').length
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
      return `${summary.right} right · ${summary.almost} almost · ${summary.wrong} wrong`
    }
    case 'feynman':
      return result.explanations.length > 0 ? 'Explained in your own words' : 'Not explained yet'
    case 'open':
      return `${counted(messagesSent(result), 'message', 'messages')} with the tutor`
  }
}

export interface SlippedItem {
  key: string
  title: string
  grade: string
  tone: BadgeTone
}

const ratingOrder: Rating[] = ['again', 'hard', 'good', 'easy']

/** Cards you missed or found tricky (their worst rating), and questions you didn't get right. */
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
      grade: ratingLabels[rating],
      tone: rating === 'again' ? 'ember' : 'sun',
    }))

  const questions = results
    .flatMap((result) => result.answers)
    .filter(({ outcome }) => outcome !== 'correct')
    .map(({ question, outcome }): SlippedItem => ({
      key: `question-${question.id}`,
      title: question.prompt,
      grade: outcome === 'not_quite' ? 'Not quite' : 'Almost',
      tone: outcome === 'not_quite' ? 'ember' : 'sun',
    }))

  return [...cards, ...questions]
}

/** "10 min" under an hour, otherwise in days: "1 day", "3 days". */
export function formatInterval(minutes: number): string {
  if (minutes < 60) {
    return `${Math.max(1, Math.round(minutes))} min`
  }

  return counted(Math.max(1, Math.round(minutes / (24 * 60))), 'day', 'days')
}

/** When the card comes back for each rating, for the rating bar. */
export function ratingIntervals(card: Flashcard): Record<Rating, string> {
  const minutes = card.next_review_in_minutes

  return {
    again: formatInterval(minutes.again),
    hard: formatInterval(minutes.hard),
    good: formatInterval(minutes.good),
    easy: formatInterval(minutes.easy),
  }
}

/** A piece of your explanation, and the gap Sprout asks about in it (if any). */
export interface ExplanationPart {
  text: string
  gap: Gap | null
}

/**
 * Splits your explanation so the gaps can be highlighted. The API quotes each gap exactly from
 * the text; a gap that can't be found (or overlaps an earlier one) is left unmarked.
 */
export function explanationParts(text: string, gaps: Gap[]): ExplanationPart[] {
  const found = gaps
    .map((gap) => ({ gap, start: text.indexOf(gap.text) }))
    .filter(({ gap, start }) => start !== -1 && gap.text !== '')
    .sort((first, second) => first.start - second.start)

  const parts: ExplanationPart[] = []
  let position = 0
  for (const { gap, start } of found) {
    if (start < position) {
      continue
    }
    if (start > position) {
      parts.push({ text: text.slice(position, start), gap: null })
    }
    parts.push({ text: gap.text, gap })
    position = start + gap.text.length
  }
  if (position < text.length) {
    parts.push({ text: text.slice(position), gap: null })
  }

  return parts
}

/** "About N min": from the start to your last rating, answer, explanation or message. */
export function sessionMinutes(
  session: Pick<PracticeSession, 'started_at' | 'last_activity_at'>,
): number {
  const start = new Date(session.started_at).getTime()
  const end = new Date(session.last_activity_at).getTime()

  return Math.max(1, Math.round((end - start) / 60_000))
}
