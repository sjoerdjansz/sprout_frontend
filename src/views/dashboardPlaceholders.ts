/*
 * Example data from the dashboard design, until the API serves the real thing. Replace these
 * with store state one section at a time; the components only care about the shapes.
 */
import type { QueueTopic } from '@/components/dashboard/RetentionQueueItem.vue'

export const progress = {
  streakDays: 6,
  masteredTopics: 2,
  totalTopics: 8,
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
