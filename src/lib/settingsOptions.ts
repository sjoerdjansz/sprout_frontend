import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import type { AvatarColor } from '@/stores/auth'
import type { AiLevel, AiUsage, CardCount, LearnerRole } from '@/stores/settings'

/** A section of the settings page, each on its own URL (`/settings/<id>`). */
export interface SettingsSection {
  id: string
  label: string
  icon: IconName
  routeName: string
}

export const settingsSections: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: 'user-round', routeName: 'settings-profile' },
  { id: 'ai', label: 'AI', icon: 'sparkles', routeName: 'settings-ai' },
  { id: 'learning', label: 'Learning', icon: 'brain', routeName: 'settings-learning' },
]

export interface RoleOption {
  id: LearnerRole
  name: string
  icon: IconName
  tint: Tint
  blurb: string
  /** How the tutor adapts, shown once you pick it. */
  tutorTitle: string
  tutorText: string
}

// The tutor adapts to these in the backend (`resources/prompts/tutor.md`); keep the notes in step.
export const roleOptions: RoleOption[] = [
  {
    id: 'student',
    name: 'Student',
    icon: 'graduation-cap',
    tint: 'sky',
    blurb: 'Exams and courses with deadlines.',
    tutorTitle: 'Deadline-aware.',
    tutorText: 'The tutor asks when your exam is and plans your goal backwards from it.',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: 'briefcase',
    tint: 'peach',
    blurb: 'Learning for your job, in small gaps.',
    tutorTitle: 'Short and practical.',
    tutorText: 'Brief answers, with examples from your field.',
  },
  {
    id: 'career_switcher',
    name: 'Career switcher',
    icon: 'rotate-ccw',
    tint: 'sun',
    blurb: 'Building a new skill set from the ground up.',
    tutorTitle: 'Foundations first.',
    tutorText:
      'The tutor checks the basics more often and links new ideas to what you know from your old field.',
  },
  {
    id: 'curious',
    name: 'Curious',
    icon: 'sparkles',
    tint: 'mint',
    blurb: 'Learning because it’s fun.',
    tutorTitle: 'No pressure.',
    tutorText: 'Kept light, with the odd interesting side path.',
  },
  {
    id: 'teacher',
    name: 'Teacher',
    icon: 'book-open',
    tint: 'sky',
    blurb: 'Staying sharp on what you teach.',
    tutorTitle: 'Explain-heavy.',
    tutorText:
      'The tutor asks you to explain things back more often, since teaching is what you do.',
  },
  {
    id: 'language_learner',
    name: 'Language learner',
    icon: 'globe',
    tint: 'sun',
    blurb: 'Vocabulary and grammar, daily.',
    tutorTitle: 'Little and often.',
    tutorText: 'Small subtopics, like a handful of words or one grammar rule.',
  },
]

export interface AvatarColorOption {
  id: AvatarColor
  name: string
}

export const avatarColorOptions: AvatarColorOption[] = [
  { id: 'sun', name: 'Sun' },
  { id: 'mint', name: 'Mint' },
  { id: 'peach', name: 'Peach' },
  { id: 'sky', name: 'Sky' },
]

export interface EffortOption {
  id: AiLevel
  label: string
  icon: IconName
  title: string
  text: string
}

// The level picks the models Sprout uses for you; never name them (design system copy rules).
export const effortOptions: EffortOption[] = [
  {
    id: 'low',
    label: 'Low',
    icon: 'zap',
    title: 'Quick and light.',
    text: 'Short answers and feedback, the fastest replies.',
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: 'sparkles',
    title: 'The default.',
    text: 'Careful explanations and feedback at a good pace. Right for most learning.',
  },
  {
    id: 'high',
    label: 'High',
    icon: 'brain',
    title: 'Thinks it through.',
    text: 'The deepest explanations and the most precise feedback. A little slower.',
  },
]

export interface UsageKind {
  key: Exclude<keyof AiUsage, 'month' | 'total'>
  label: string
  icon: IconName
  tint: Tint
  hint: string
}

export const usageKinds: UsageKind[] = [
  {
    key: 'tutor_replies',
    label: 'Tutor replies',
    icon: 'message-circle',
    tint: 'peach',
    hint: 'In chats and open sessions',
  },
  {
    key: 'answers_checked',
    label: 'Answers checked',
    icon: 'list-checks',
    tint: 'sky',
    hint: 'Open quiz questions',
  },
  {
    key: 'explain_feedback',
    label: 'Explain it feedback',
    icon: 'lightbulb',
    tint: 'sun',
    hint: 'Gaps found in your explanations',
  },
  {
    key: 'card_batches',
    label: 'Card batches made',
    icon: 'layers',
    tint: 'mint',
    hint: 'From your chats and notes',
  },
]

/** "2026-10" → "1–31 October": the whole calendar month the usage counts. */
export function usagePeriod(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  if (year === undefined || monthNumber === undefined || Number.isNaN(year + monthNumber)) {
    return month
  }
  // Day 0 of the next month is the last day of this one.
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const monthName = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleString('en-GB', {
    month: 'long',
    timeZone: 'UTC',
  })

  return `1–${lastDay} ${monthName}`
}

export const cardCounts: CardCount[] = [10, 20, 40]
