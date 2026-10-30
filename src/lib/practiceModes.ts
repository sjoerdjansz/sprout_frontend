/*
 * The ways to practise a topic, shared by the dashboard and the knowledge map so both offer the
 * same four. Each one trains one facet of a subtopic, except an open session with the tutor.
 */
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import type { FacetKey } from '@/stores/topics'

export type PracticeModeId = 'cards' | 'retrieval' | 'feynman' | 'open'

export interface PracticeMode {
  id: PracticeModeId
  name: string
  blurb: string
  icon: IconName
  tint: Tint
  /** The facet this mode trains; an open session trains all of them. */
  facet: FacetKey | null
  minutes: number
  startLabel: string
}

export const practiceModes: PracticeMode[] = [
  {
    id: 'cards',
    name: 'Flashcards',
    blurb: 'Flip the cards and rate your recall.',
    icon: 'layers',
    tint: 'mint',
    facet: 'cards',
    minutes: 8,
    startLabel: 'Start flashcards',
  },
  {
    id: 'retrieval',
    name: 'Retrieval quiz',
    blurb: 'Multiple choice and open questions, from memory.',
    icon: 'list-checks',
    tint: 'sky',
    facet: 'quiz',
    minutes: 10,
    startLabel: 'Start retrieval quiz',
  },
  {
    id: 'feynman',
    name: 'Explain it',
    blurb: 'Explain it in your own words; I’ll find the gaps.',
    icon: 'lightbulb',
    tint: 'sun',
    facet: 'explain',
    minutes: 12,
    startLabel: 'Start explaining',
  },
  {
    id: 'open',
    name: 'Open session',
    blurb: 'Talk it through with the tutor and go deeper.',
    icon: 'message-circle',
    tint: 'peach',
    facet: null,
    minutes: 15,
    startLabel: 'Start open session',
  },
]

export function practiceMode(id: PracticeModeId): PracticeMode {
  const mode = practiceModes.find((candidate) => candidate.id === id)
  if (mode === undefined) {
    throw new Error(`There is no practice mode ${id}.`)
  }

  return mode
}
