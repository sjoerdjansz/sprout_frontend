/*
 * The four ways to practise, shown on the dashboard. Each one trains one facet of a subtopic,
 * except an open session with the tutor.
 */
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'

export type PracticeModeId = 'cards' | 'retrieval' | 'feynman' | 'open'

export interface PracticeMode {
  id: PracticeModeId
  name: string
  blurb: string
  icon: IconName
  tint: Tint
}

export const practiceModes: PracticeMode[] = [
  {
    id: 'cards',
    name: 'Flashcards',
    blurb: 'Flip the cards and rate your recall.',
    icon: 'layers',
    tint: 'mint',
  },
  {
    id: 'retrieval',
    name: 'Retrieval quiz',
    blurb: 'Multiple choice and open questions, from memory.',
    icon: 'list-checks',
    tint: 'sky',
  },
  {
    id: 'feynman',
    name: 'Explain it',
    blurb: 'Explain it in your own words; I’ll find the gaps.',
    icon: 'lightbulb',
    tint: 'sun',
  },
  {
    id: 'open',
    name: 'Open session',
    blurb: 'Talk it through with the tutor and go deeper.',
    icon: 'message-circle',
    tint: 'peach',
  },
]
