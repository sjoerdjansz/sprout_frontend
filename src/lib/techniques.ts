/*
 * The learning techniques a practice tutor turn can apply (`../API.md`, the practice session's
 * messages), with the badge the design system gives each: its plain name, colour and icon.
 */
import type { BadgeTone } from '@/components/BaseBadge.vue'
import type { IconName } from '@/components/icons'

export type Technique =
  'retrieval_practice' | 'feynman' | 'testing_effect' | 'interleaving' | 'spaced_repetition'

export interface TechniqueBadge {
  label: string
  tone: BadgeTone
  icon: IconName
}

export const techniqueBadges: Record<Technique, TechniqueBadge> = {
  retrieval_practice: { label: 'Retrieval practice', tone: 'sky', icon: 'brain' },
  spaced_repetition: { label: 'Spaced repetition', tone: 'sun', icon: 'repeat' },
  testing_effect: { label: 'Testing effect', tone: 'sky', icon: 'list-checks' },
  feynman: { label: 'Feynman technique', tone: 'sun', icon: 'lightbulb' },
  interleaving: { label: 'Interleaving', tone: 'sprout', icon: 'shuffle' },
}
