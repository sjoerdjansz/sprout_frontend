import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import { demoCategories, demoTopics } from '@/stores/topicsDemoData'

/*
 * Your library: topics and their subtopics, with mastery and what's due.
 *
 * There is no topics API yet, so the store starts with the knowledge map design's example data
 * and keeps your changes in memory until you reload (see ../specs/knowledge-map.md). When the
 * backend exists, the actions call `api()` and the components stay as they are.
 */

/** A starter category, or one you made yourself. */
export interface Category {
  id: number
  name: string
}

/** The three ways you show you know a subtopic: flashcards, explaining it, and quizzes. */
export type FacetKey = 'cards' | 'explain' | 'quiz'

export interface FacetProgress {
  /** Null until you've practised this facet. */
  percent: number | null
  /** Holding over time: at least 85% on two spaced reviews in a row, not just one good session. */
  holding: boolean
}

export interface Subtopic {
  id: number
  title: string
  description: string
  notes: string
  /** 0–100 */
  mastery: number
  dueCards: number
  /** "today", "in 4 days"; null before your first session. */
  nextReview: string | null
  /**
   * Fading: it had reached 65% or more, and your expected recall is now below 65%. Something you're
   * still learning isn't slipping, it just isn't there yet.
   */
  slipping: boolean
  /** Added but not practised yet. */
  isNew: boolean
  facets: Record<FacetKey, FacetProgress>
}

export interface Topic {
  id: number
  title: string
  description: string
  notes: string
  categoryId: number
  icon: IconName
  tint: Tint
  subtopics: Subtopic[]
}

export interface TopicInput {
  title: string
  description: string
  notes: string
  categoryId: number
}

export interface SubtopicInput {
  title: string
  description: string
  notes: string
  topicId: number
}

const newTopicTints: Tint[] = ['mint', 'sun', 'peach', 'sky']

export const useTopicsStore = defineStore('topics', () => {
  const categories = ref<Category[]>(demoCategories())
  const topics = ref<Topic[]>(demoTopics())

  // Demo ids only; the API will hand out real ones.
  let lastId = Math.max(
    ...topics.value.flatMap((topic) => [
      topic.id,
      ...topic.subtopics.map((subtopic) => subtopic.id),
    ]),
  )

  function nextId(): number {
    lastId += 1

    return lastId
  }

  function categoryName(categoryId: number): string {
    const category = categories.value.find((candidate) => candidate.id === categoryId)
    if (category === undefined) {
      throw new Error(`There is no category ${categoryId}.`)
    }

    return category.name
  }

  /** Adds a category of your own and returns its id; a name you already have returns that one. */
  function addCategory(name: string): number {
    const existing = categories.value.find(
      (category) => category.name.toLowerCase() === name.trim().toLowerCase(),
    )
    if (existing !== undefined) {
      return existing.id
    }

    const id = nextId()
    categories.value.push({ id, name: name.trim() })

    return id
  }

  function findTopic(topicId: number): Topic {
    const topic = topics.value.find((candidate) => candidate.id === topicId)
    if (topic === undefined) {
      throw new Error(`There is no topic ${topicId}.`)
    }

    return topic
  }

  /** Adds a main topic and returns its id. */
  function addTopic(input: TopicInput): number {
    const id = nextId()
    topics.value.push({
      id,
      ...input,
      icon: 'book-open',
      // Rotate the tints through the library, as the design system asks.
      tint: newTopicTints[topics.value.length % newTopicTints.length] ?? 'mint',
      subtopics: [],
    })

    return id
  }

  function updateTopic(topicId: number, input: TopicInput): void {
    Object.assign(findTopic(topicId), input)
  }

  /** Adds a subtopic you haven't practised yet and returns its id. */
  function addSubtopic(input: SubtopicInput): number {
    const id = nextId()
    findTopic(input.topicId).subtopics.push({
      id,
      title: input.title,
      description: input.description,
      notes: input.notes,
      mastery: 0,
      dueCards: 0,
      nextReview: null,
      slipping: false,
      isNew: true,
      facets: {
        cards: { percent: null, holding: false },
        explain: { percent: null, holding: false },
        quiz: { percent: null, holding: false },
      },
    })

    return id
  }

  /** Renames or rewrites a subtopic; a different `topicId` moves it to that topic. */
  function updateSubtopic(subtopicId: number, input: SubtopicInput): void {
    const currentTopic = topics.value.find((topic) =>
      topic.subtopics.some((subtopic) => subtopic.id === subtopicId),
    )
    const subtopic = currentTopic?.subtopics.find((candidate) => candidate.id === subtopicId)
    if (currentTopic === undefined || subtopic === undefined) {
      throw new Error(`There is no subtopic ${subtopicId}.`)
    }

    subtopic.title = input.title
    subtopic.description = input.description
    subtopic.notes = input.notes

    if (currentTopic.id !== input.topicId) {
      const newTopic = findTopic(input.topicId)
      currentTopic.subtopics = currentTopic.subtopics.filter(
        (candidate) => candidate.id !== subtopicId,
      )
      newTopic.subtopics.push(subtopic)
    }
  }

  return {
    categories,
    topics,
    categoryName,
    addCategory,
    addTopic,
    updateTopic,
    addSubtopic,
    updateSubtopic,
  }
})
