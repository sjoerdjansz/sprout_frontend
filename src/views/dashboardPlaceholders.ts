/*
 * Example data from the dashboard design, until the API serves the real thing. Replace these
 * with store state one section at a time; the components only care about the shapes.
 */
import type { Suggestion } from '@/components/chat/ChatComposer.vue'
import type { PracticeMode } from '@/components/dashboard/PracticeModeCard.vue'
import type { QueueTopic } from '@/components/dashboard/RetentionQueueItem.vue'
import type { LastSession } from '@/components/dashboard/TutorPrompt.vue'
import type { WeeklyStat } from '@/components/dashboard/WeeklyInsights.vue'

export const progress = {
  streakDays: 6,
  masteredTopics: 2,
  totalTopics: 8,
}

export const suggestions: Suggestion[] = [
  { label: 'Explain a new concept', icon: 'sparkles' },
  { label: 'Clear up Recursion', icon: 'circle-help' },
  { label: 'Feynman: Photosynthesis', icon: 'lightbulb' },
  { label: 'Quiz me on Spanish verbs', icon: 'list-checks' },
]

export const lastSession: LastSession = {
  topic: 'Photosynthesis · the light reactions',
  lastStudied: '2 hours ago',
}

export const retentionQueue = {
  dueCount: 26,
  minutes: 13,
  topics: [
    { topic: 'Spanish verbs', cardCount: 12, recallPercent: 55, slipping: true, tint: 'sun' },
    { topic: 'Cell respiration', cardCount: 6, recallPercent: 61, slipping: true, tint: 'sun' },
    { topic: 'Recursion', cardCount: 5, recallPercent: 74, slipping: false, tint: 'sky' },
    { topic: 'Photosynthesis', cardCount: 3, recallPercent: 81, slipping: false, tint: 'mint' },
  ] satisfies QueueTopic[],
}

export const practiceModes: PracticeMode[] = [
  {
    title: 'Retrieval practice',
    description: 'Answer from memory first, then check. Recall beats rereading.',
    icon: 'brain',
    tint: 'sky',
  },
  {
    title: 'Spaced repetition',
    description: 'Review each card right before you would forget it.',
    icon: 'repeat',
    tint: 'sun',
  },
  {
    title: 'Feynman technique',
    description: 'Explain a topic simply. I’ll point out gaps and jargon.',
    icon: 'lightbulb',
    tint: 'sun',
  },
  {
    title: 'Flashcards',
    description: 'Words and images together for quick checks (dual coding).',
    icon: 'layers',
    tint: 'mint',
  },
  {
    title: 'Interleaving',
    description: 'Mix topics in one session so knowledge stays flexible.',
    icon: 'shuffle',
    tint: 'peach',
  },
]

export const weeklyStats: WeeklyStat[] = [
  {
    label: 'Streak',
    value: '6',
    unit: 'days',
    hint: 'Best so far: 14 days',
    icon: 'flame',
    tint: 'sun',
  },
  {
    label: 'Recall rate',
    value: '87%',
    hint: '+3 points vs last week',
    icon: 'target',
    tint: 'sky',
  },
  {
    label: 'Study time',
    value: '2h 40m',
    hint: 'Mostly Spanish and Biology',
    icon: 'clock',
    tint: 'mint',
  },
  {
    label: 'Topics mastered',
    value: '2',
    unit: 'of 8',
    hint: 'Recursion is next in line',
    icon: 'trophy',
    tint: 'peach',
  },
]
