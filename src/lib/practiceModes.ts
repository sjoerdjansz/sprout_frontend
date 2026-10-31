/*
 * The four ways to practise, shown on the dashboard and the practice setup. Each one trains one
 * facet of a subtopic, except an open session with the tutor. A session can combine several of
 * them; they then run in the order of this list (see `../specs/practice-session.md`).
 */
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'

export type PracticeModeId = 'cards' | 'retrieval' | 'feynman' | 'open'

/** What a sized mode counts: you pick how many of them a session has. */
export type PracticeUnit = 'cards' | 'questions'

export interface PracticeMode {
  id: PracticeModeId
  name: string
  blurb: string
  icon: IconName
  tint: Tint
  /** Null for the modes without a fixed amount (Explain it, Open session). */
  unit: PracticeUnit | null
  sizes: number[]
  defaultSize: number
  /** Minutes per card or question for a sized mode, or the whole block otherwise. */
  minutes: number
  /** "Why this helps" on the setup page: the learning principle in plain words. */
  why: string
}

export const practiceModes: PracticeMode[] = [
  {
    id: 'cards',
    name: 'Flashcards',
    blurb: 'Flip the cards and rate your recall.',
    icon: 'layers',
    tint: 'mint',
    unit: 'cards',
    sizes: [10, 20, 40],
    defaultSize: 20,
    minutes: 0.4,
    why: 'Rating your own recall on each card is retrieval practice; the intervals that follow are spaced repetition.',
  },
  {
    id: 'retrieval',
    name: 'Retrieval quiz',
    blurb: 'Multiple-choice questions, from memory.',
    icon: 'list-checks',
    tint: 'sky',
    unit: 'questions',
    sizes: [5, 10, 20],
    defaultSize: 10,
    minutes: 1,
    why: 'Answering from memory before you see the answer strengthens the memory far more than rereading.',
  },
  {
    id: 'feynman',
    name: 'Explain it',
    blurb: 'Explain it in your own words; I’ll find the gaps.',
    icon: 'lightbulb',
    tint: 'sun',
    unit: null,
    sizes: [],
    defaultSize: 0,
    minutes: 12,
    why: 'Explaining simply exposes what you only half understand (the Feynman technique). The gaps become your next questions.',
  },
  {
    id: 'open',
    name: 'Open session',
    blurb: 'Talk it through with the tutor and go deeper.',
    icon: 'message-circle',
    tint: 'peach',
    unit: null,
    sizes: [],
    defaultSize: 0,
    minutes: 15,
    why: 'Sprout stays one step ahead of what you already know and asks before it tells, so you build the idea yourself.',
  },
]

/** "Why this helps" when a session combines several modes. */
export const mixedWhy =
  'Remembering the same ideas in different ways (rating cards, answering questions, explaining) makes them stick in more situations than drilling one way.'

/**
 * "Why this helps" for one mode. The quiz only mentions the second try when you get one
 * ("Hint before the answer" in your settings).
 */
export function whyThisHelps(mode: PracticeMode, secondTry: boolean): string {
  if (mode.id === 'retrieval' && secondTry) {
    return `${mode.why} A wrong answer gets a second try, so you retrieve twice.`
  }

  return mode.why
}

export function practiceMode(id: PracticeModeId): PracticeMode {
  const mode = practiceModes.find((candidate) => candidate.id === id)
  if (mode === undefined) {
    throw new Error(`Unknown practice mode ${id}`)
  }

  return mode
}

export function isPracticeModeId(value: string): value is PracticeModeId {
  return practiceModes.some((mode) => mode.id === value)
}
