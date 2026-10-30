/*
 * The knowledge map's rules: when a subtopic counts as mastered or slipping, what needs your
 * attention, what to practise next, and which topics a search shows. Kept apart from the
 * components so they stay presentational and the rules are easy to test.
 */
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
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
  return !subtopic.isNew && !subtopic.slipping && holdingCount(subtopic) === facets.length
}

export function needsAttention(subtopic: Subtopic): boolean {
  return subtopic.dueCards > 0 || subtopic.slipping
}

export function averageMastery(topic: Topic): number {
  if (topic.subtopics.length === 0) {
    return 0
  }
  const total = topic.subtopics.reduce((sum, subtopic) => sum + subtopic.mastery, 0)

  return Math.round(total / topic.subtopics.length)
}

export function dueCards(topic: Topic): number {
  return topic.subtopics.reduce((sum, subtopic) => sum + subtopic.dueCards, 0)
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
  if (subtopic.isNew) {
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

export function topicLevel(topic: Topic): Level {
  if (topic.subtopics.length === 0) {
    return levels.new
  }
  if (topic.subtopics.some((subtopic) => subtopic.slipping)) {
    return levels.slipping
  }
  if (topic.subtopics.every(isMastered)) {
    return levels.mastered
  }

  return averageMastery(topic) >= growingFrom ? levels.growing : levels.seedling
}

export interface Caption {
  text: string
  tone: 'subtle' | 'sun' | 'sprout'
}

/** The one line under a subtopic's name: the most urgent thing about it. */
export function subtopicCaption(subtopic: Subtopic): Caption {
  if (subtopic.isNew) {
    return { text: 'Not started yet', tone: 'subtle' }
  }
  if (subtopic.slipping) {
    return { text: `Slipping · ${pluralize(subtopic.dueCards, 'card')} due`, tone: 'sun' }
  }
  if (subtopic.dueCards > 0) {
    return { text: `${pluralize(subtopic.dueCards, 'card')} due today`, tone: 'sun' }
  }
  if (isMastered(subtopic)) {
    return { text: 'Mastered', tone: 'sprout' }
  }

  return {
    text: `Next review ${subtopic.nextReview ?? 'after your first session'}`,
    tone: 'subtle',
  }
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
    if (filters.categoryId !== 'all' && topic.categoryId !== filters.categoryId) {
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
  return categories.filter((category) => topics.some((topic) => topic.categoryId === category.id))
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

export interface PracticeSuggestion {
  mode: PracticeMode
  /** Finishes "Suggested: Flashcards — …" */
  reason: string
}

/**
 * For a subtopic: train its weakest facet that isn't holding yet, untried facets first. For a
 * whole topic: review what's due, otherwise go deeper with the tutor.
 */
export function suggestPractice(topic: Topic, subtopic: Subtopic | null): PracticeSuggestion {
  if (subtopic === null) {
    const due = dueCards(topic)

    return due > 0
      ? {
          mode: practiceMode('cards'),
          reason: `${pluralize(due, 'card')} ${due === 1 ? 'is' : 'are'} due across ${topic.title}.`,
        }
      : { mode: practiceMode('open'), reason: 'nothing is due, so go deeper.' }
  }

  // Untried facets count as -1, so they come before any practised one.
  const weakest = facets
    .filter((facet) => !subtopic.facets[facet.key].holding)
    .sort(
      (first, second) =>
        (subtopic.facets[first.key].percent ?? -1) - (subtopic.facets[second.key].percent ?? -1),
    )[0]

  if (weakest === undefined) {
    return {
      mode: practiceMode('open'),
      reason: 'all three facets are holding, so go deeper.',
    }
  }

  const mode = practiceModes.find((candidate) => candidate.facet === weakest.key)
  if (mode === undefined) {
    throw new Error(`No practice mode trains ${weakest.key}.`)
  }

  return {
    mode,
    reason:
      subtopic.facets[weakest.key].percent === null
        ? 'you haven’t tried this facet yet.'
        : 'your weakest facet.',
  }
}
