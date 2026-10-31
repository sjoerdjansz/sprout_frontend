import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import type { AvatarColor } from '@/stores/auth'
import type { LearnerRole } from '@/stores/settings'

/** A section of the settings page, each on its own URL (`/settings/<id>`). */
export interface SettingsSection {
  id: string
  label: string
  icon: IconName
  routeName: string
}

export const settingsSections: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: 'user-round', routeName: 'settings-profile' },
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
