/*
 * The dashboard's rules (see `../specs/dashboard.md`): which topics are mastered, which ones are in
 * today's retention queue and how long reviewing them takes. All of it comes from `GET /topics`.
 */
import type { Tint } from '@/components/IconTile.vue'
import {
  averageMastery,
  dueCards,
  isMastered,
  needsAttention,
  topicAppearance,
} from '@/lib/knowledgeMap'
import { practiceMode } from '@/lib/practiceModes'
import type { Topic } from '@/stores/topics'

export interface QueueTopic {
  topicId: number
  title: string
  /** Cards due today. */
  cardCount: number
  /** The topic's average mastery, 0–100. */
  mastery: number
  /** One of its subtopics is slipping: shown in sun so it stands out from what's simply due. */
  slipping: boolean
  tint: Tint
}

/** A topic is mastered once it has subtopics and every one of them is mastered. */
export function isTopicMastered(topic: Topic): boolean {
  return topic.subtopics.length > 0 && topic.subtopics.every(isMastered)
}

export function masteredTopicCount(topics: Topic[]): number {
  return topics.filter(isTopicMastered).length
}

/** The topics that need attention, slipping ones first, then the most cards due. */
export function retentionQueue(topics: Topic[]): QueueTopic[] {
  const queue: QueueTopic[] = topics
    .filter((topic) => topic.subtopics.some(needsAttention))
    .map((topic) => ({
      topicId: topic.id,
      title: topic.title,
      cardCount: dueCards(topic),
      mastery: averageMastery(topic),
      slipping: topic.subtopics.some((subtopic) => subtopic.slipping),
      tint: topicAppearance(topic).tint,
    }))

  return queue.sort((first, second) => {
    if (first.slipping !== second.slipping) {
      return first.slipping ? -1 : 1
    }

    return second.cardCount - first.cardCount
  })
}

/** Rough minutes to review this many cards, with the practice setup's time per card. */
export function reviewMinutes(cardCount: number): number {
  return Math.ceil(cardCount * practiceMode('cards').minutes)
}
