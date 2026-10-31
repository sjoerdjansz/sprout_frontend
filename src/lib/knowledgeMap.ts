/*
 * The knowledge map's rules: when a subtopic counts as mastered or slipping, what needs your
 * attention, and which topics a search shows. Kept apart from the
 * components so they stay presentational and the rules are easy to test.
 */
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import { dueLabel } from '@/lib/dueDate'
import type { Category, FacetKey, FacetProgress, Subtopic, Topic } from '@/stores/topics'

export interface Facet {
  key: FacetKey
  label: string
  icon: IconName
}

export const facets: Facet[] = [
  { key: 'cards', label: 'Flashcards', icon: 'layers' },
  { key: 'explain', label: 'Explain it', icon: 'lightbulb' },
  { key: 'quiz', label: 'Quiz', icon: 'list-checks' },
]

/** "1 subtopic", "4 subtopics" */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function holdingCount(subtopic: Subtopic): number {
  return facets.filter((facet) => subtopic.facets[facet.key].holding).length
}

/** Mastered means all three facets hold over time, not one good session. */
export function isMastered(subtopic: Subtopic): boolean {
  return !subtopic.is_new && !subtopic.slipping && holdingCount(subtopic) === facets.length
}

export function needsAttention(subtopic: Subtopic): boolean {
  return subtopic.due_cards > 0 || subtopic.slipping
}

export function averageMastery(topic: Topic): number {
  if (topic.subtopics.length === 0) {
    return 0
  }
  const total = topic.subtopics.reduce((sum, subtopic) => sum + subtopic.mastery, 0)

  return Math.round(total / topic.subtopics.length)
}

export function dueCards(topic: Topic): number {
  return topic.subtopics.reduce((sum, subtopic) => sum + subtopic.due_cards, 0)
}

export type FacetState = 'holding' | 'started' | 'not-started'

export function facetState(progress: FacetProgress): FacetState {
  if (progress.holding) {
    return 'holding'
  }

  return progress.percent === null ? 'not-started' : 'started'
}

export type LevelTone = 'neutral' | 'sprout' | 'sun' | 'sky'

export interface Level {
  label: 'New' | 'Slipping' | 'Mastered' | 'Growing' | 'Seedling'
  tone: LevelTone
  icon: IconName
}

const levels = {
  new: { label: 'New', tone: 'sky', icon: 'sparkles' },
  slipping: { label: 'Slipping', tone: 'sun', icon: 'trending-down' },
  mastered: { label: 'Mastered', tone: 'sprout', icon: 'check' },
  growing: { label: 'Growing', tone: 'sprout', icon: 'sprout' },
  seedling: { label: 'Seedling', tone: 'neutral', icon: 'sprout' },
} satisfies Record<string, Level>

// From 60% on a subtopic is growing; below that it's still a seedling.
const growingFrom = 60

export function subtopicLevel(subtopic: Subtopic): Level {
  if (subtopic.is_new) {
    return levels.new
  }
  if (subtopic.slipping) {
    return levels.slipping
  }
  if (isMastered(subtopic)) {
    return levels.mastered
  }

  return subtopic.mastery >= growingFrom ? levels.growing : levels.seedling
}

export interface Caption {
  text: string
  tone: 'subtle' | 'sun' | 'sprout' | 'sky' | 'ember'
}

/** What the learner sees while Sprout makes a subtopic's cards in the background. */
export const generatingMessage = 'Sprout is making your cards…'

/** The one line under a subtopic's name: the most urgent thing about it. */
export function subtopicCaption(subtopic: Subtopic): Caption {
  // Cards on their way (or that couldn't be made) explain an empty or unchanged subtopic.
  if (subtopic.generation_status === 'generating') {
    return { text: generatingMessage, tone: 'sky' }
  }
  if (subtopic.generation_status === 'failed') {
    return { text: "Sprout couldn't make its cards. Try again on its page.", tone: 'ember' }
  }
  // New cards are due straight away, so a subtopic you haven't started can need attention too.
  if (subtopic.is_new) {
    return subtopic.due_cards > 0
      ? { text: `Not started yet · ${pluralize(subtopic.due_cards, 'card')} due`, tone: 'sun' }
      : { text: 'Not started yet', tone: 'subtle' }
  }
  if (subtopic.slipping) {
    return { text: `Slipping · ${pluralize(subtopic.due_cards, 'card')} due`, tone: 'sun' }
  }
  if (subtopic.due_cards > 0) {
    return { text: `${pluralize(subtopic.due_cards, 'card')} due today`, tone: 'sun' }
  }
  if (isMastered(subtopic)) {
    return { text: 'Mastered', tone: 'sprout' }
  }

  const nextReview =
    subtopic.next_review_on === null
      ? 'after your first session'
      : dueLabel(subtopic.next_review_on)

  return { text: `Next review ${nextReview}`, tone: 'subtle' }
}

export interface LibraryFilters {
  query: string
  categoryId: number | 'all'
  needsAttention: boolean
}

export const noFilters: LibraryFilters = { query: '', categoryId: 'all', needsAttention: false }

function matches(title: string, query: string): boolean {
  return title.toLowerCase().includes(query)
}

/** A search finds a topic by its own name or by the name of one of its subtopics. */
export function filterTopics(topics: Topic[], filters: LibraryFilters): Topic[] {
  const query = filters.query.trim().toLowerCase()

  return topics.filter((topic) => {
    if (filters.categoryId !== 'all' && topic.category.id !== filters.categoryId) {
      return false
    }
    if (
      query !== '' &&
      !matches(topic.title, query) &&
      !topic.subtopics.some((subtopic) => matches(subtopic.title, query))
    ) {
      return false
    }

    return !filters.needsAttention || topic.subtopics.some(needsAttention)
  })
}

/** When the topic's own name matches the search, all its subtopics stay visible. */
export function visibleSubtopics(topic: Topic, filters: LibraryFilters): Subtopic[] {
  const query = filters.query.trim().toLowerCase()

  return topic.subtopics.filter((subtopic) => {
    if (query !== '' && !matches(subtopic.title, query) && !matches(topic.title, query)) {
      return false
    }

    return !filters.needsAttention || needsAttention(subtopic)
  })
}

/** The categories worth a filter chip: the ones your topics use, in their own order. */
export function usedCategories(categories: Category[], topics: Topic[]): Category[] {
  return categories.filter((category) => topics.some((topic) => topic.category.id === category.id))
}

export function librarySummary(topics: Topic[]): string {
  const subtopics = topics.flatMap((topic) => topic.subtopics)
  const mastered = subtopics.filter(isMastered).length
  const due = topics.reduce((sum, topic) => sum + dueCards(topic), 0)

  return [
    pluralize(topics.length, 'topic'),
    pluralize(subtopics.length, 'subtopic'),
    `${mastered} mastered`,
    `${pluralize(due, 'card')} due today`,
  ].join(' · ')
}

export interface TopicAppearance {
  icon: IconName
  tint: Tint
}

// The starter categories get an icon of their own; categories you make get the open book.
const categoryIcons: Record<string, IconName> = {
  science: 'sprout',
  technology: 'zap',
  maths: 'chart-no-axes-column',
  languages: 'message-circle',
  history: 'book-open',
  'arts & culture': 'sparkles',
}

const tints: Tint[] = ['mint', 'sun', 'peach', 'sky']

/**
 * A topic's icon tile. Presentation only, so the API doesn't store it: the icon follows the
 * category and the tints rotate through the library by id, so a topic keeps its colour.
 */
export function topicAppearance(topic: Topic): TopicAppearance {
  return {
    icon: categoryIcons[topic.category.name.toLowerCase()] ?? 'book-open',
    tint: tints[topic.id % tints.length] ?? 'mint',
  }
}
