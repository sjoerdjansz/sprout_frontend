/*
 * The subtopic page's rules: what each filter shows, and how a card's status, an answer's verdict
 * and a question's type look. Kept apart from the components so they stay presentational and the
 * rules are easy to test. Search and filters run here, not in the API: a subtopic has tens of
 * items, not thousands.
 */
import type { BadgeTone } from '@/components/BaseBadge.vue'
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import { dueLabel } from '@/lib/dueDate'
import { pluralize } from '@/lib/knowledgeMap'
import { practiceMode } from '@/lib/practiceModes'
import { capitalize } from '@/lib/text'
import type { Flashcard } from '@/stores/flashcards'
import type { PracticeSession } from '@/stores/practice'
import type { Question, QuestionType, Verdict } from '@/stores/questions'

function matches(text: string | null, query: string): boolean {
  return text !== null && text.toLowerCase().includes(query)
}

function normalized(query: string): string {
  return query.trim().toLowerCase()
}

export type FlashcardFilter = 'all' | 'due' | 'weak' | 'paused'

export const flashcardFilters: { id: FlashcardFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'due', label: 'Due today' },
  { id: 'weak', label: 'Weak' },
  { id: 'paused', label: 'Paused' },
]

// Below this expected recall a card counts as weak; the API uses the same number.
const weakRecallBelow = 70

/** A card you never reviewed has no recall yet, so it isn't weak. */
export function isWeak(card: Flashcard): boolean {
  return card.recall !== null && card.recall < weakRecallBelow
}

export function filterFlashcards(
  cards: Flashcard[],
  query: string,
  filter: FlashcardFilter,
): Flashcard[] {
  const search = normalized(query)

  return cards.filter((card) => {
    if (search !== '' && !matches(card.front, search) && !matches(card.back, search)) {
      return false
    }

    switch (filter) {
      case 'due':
        return card.is_due
      case 'weak':
        return isWeak(card)
      case 'paused':
        return card.paused
      case 'all':
        return true
    }
  })
}

export interface CardStatus {
  label: string
  tone: BadgeTone
  icon: IconName
  tint: Tint
}

export function flashcardStatus(card: Flashcard): CardStatus {
  if (card.paused) {
    return { label: 'Paused', tone: 'neutral', icon: 'pause', tint: 'peach' }
  }
  if (card.is_due) {
    return { label: 'Due today', tone: 'sun', icon: 'repeat', tint: 'sun' }
  }

  return {
    label: `Due ${dueLabel(card.due_on)}`,
    tone: 'sprout',
    icon: 'calendar-check',
    tint: 'mint',
  }
}

/** "Last: Good · 88% recall"; null for a card you haven't reviewed yet. */
export function lastReview(card: Flashcard): string | null {
  if (card.last_rating === null || card.recall === null) {
    return null
  }

  return `Last: ${capitalize(card.last_rating)} · ${card.recall}% recall`
}

export type QuestionFilter = 'all' | QuestionType | 'wrong'

export const questionFilters: { id: QuestionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'multiple_choice', label: 'Multiple choice' },
  { id: 'open', label: 'Open' },
  { id: 'feynman', label: 'Explain it' },
  { id: 'wrong', label: 'Wrong only' },
]

/** What you answered, in words: your typed answer, or the option you picked. */
export function answerText(question: Question): string | null {
  const answer = question.latest_answer
  if (answer === null) {
    return null
  }
  if (question.type !== 'multiple_choice') {
    return answer.response
  }

  return question.options.find((option) => option.id === answer.option_id)?.label ?? null
}

export function filterQuestions(
  questions: Question[],
  query: string,
  filter: QuestionFilter,
): Question[] {
  const search = normalized(query)

  return questions.filter((question) => {
    if (
      search !== '' &&
      !matches(question.prompt, search) &&
      !matches(answerText(question), search)
    ) {
      return false
    }

    if (filter === 'all') {
      return true
    }
    // "Wrong only" means Not quite: an Almost was half right.
    if (filter === 'wrong') {
      return question.latest_answer?.verdict === 'not_quite'
    }

    return question.type === filter
  })
}

export interface Look {
  label: string
  icon: IconName
}

/** A verdict always carries an icon and a word, never only a colour (design system rule). */
export const verdictLooks: Record<Verdict, Look & { tone: BadgeTone }> = {
  correct: { label: 'Correct', icon: 'check', tone: 'sprout' },
  almost: { label: 'Almost', icon: 'sparkles', tone: 'sun' },
  not_quite: { label: 'Not quite', icon: 'rotate-ccw', tone: 'ember' },
}

/** The learning technique's own icon and colour: quizzes are sky, explaining it is sun. */
export const questionTypeLooks: Record<QuestionType, Look & { tint: Tint }> = {
  multiple_choice: { label: 'Multiple choice', icon: 'list-checks', tint: 'sky' },
  open: { label: 'Open question', icon: 'brain', tint: 'sky' },
  feynman: { label: 'Explain it', icon: 'lightbulb', tint: 'sun' },
}

/** "Flashcards", or "Mixed session" for several ways to practise. */
export function sessionTitle(session: PracticeSession): string {
  const [only, ...others] = session.plan.modes

  return only === undefined || others.length > 0 ? 'Mixed session' : practiceMode(only).name
}

/** What you did in it: "12 cards · 3 questions · 1 explanation · 4 messages". */
export function sessionActivity(session: PracticeSession): string {
  const done = session.done
  const cards = new Set(done.flashcard_reviews.map((review) => review.flashcard_id)).size
  const questions = done.answers.filter((answer) => answer.score !== null).length
  const explanations = done.explanations.length
  const messages = done.messages.filter((message) => message.role === 'user').length

  const parts = [
    cards > 0 ? pluralize(cards, 'card') : null,
    questions > 0 ? pluralize(questions, 'question') : null,
    explanations > 0 ? pluralize(explanations, 'explanation') : null,
    messages > 0 ? pluralize(messages, 'message') : null,
  ]

  const activity = parts.filter((part) => part !== null).join(' · ')

  return activity === '' ? 'Nothing practised yet' : activity
}

/** A session is found by how you practised or by what was said with the tutor. */
export function filterSessions(sessions: PracticeSession[], query: string): PracticeSession[] {
  const search = normalized(query)
  if (search === '') {
    return sessions
  }

  return sessions.filter(
    (session) =>
      matches(sessionTitle(session), search) ||
      session.done.messages.some((message) => matches(message.content, search)),
  )
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => word !== '').length
}
