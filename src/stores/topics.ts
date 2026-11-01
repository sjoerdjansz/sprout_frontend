import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, api } from '@/lib/api'
import type { Goal } from '@/stores/conversations'

/*
 * Your library: topics and their subtopics, with mastery and what's due (`../API.md`, "Knowledge
 * map"), and the one subtopic the subtopic page shows ("Subtopic page").
 */

/** A starter category, or one you made yourself. */
export interface Category {
  id: number
  name: string
}

/** The three ways you show you know a subtopic: flashcards, explaining it, and quizzes. */
export type FacetKey = 'cards' | 'explain' | 'quiz'

export interface FacetProgress {
  /** 0–100; null until you've practised this facet. */
  percent: number | null
  /** Holding over time: at least 85% on the last two days you practised it. */
  holding: boolean
}

/**
 * Whether Sprout is still making a subtopic's flashcards and questions in the background
 * (`../API.md`, "Material made in the background"). `failed` after every try failed.
 */
export type GenerationStatus = 'ready' | 'generating' | 'failed'

export interface Subtopic {
  id: number
  topic_id: number
  title: string
  description: string | null
  /**
   * Your own notes only (the subtopic form's field). The tutor's notes from the chat and the parts
   * of your files are separate sources, listed on the subtopic page (`SubtopicDetail.sources`).
   */
  notes: string | null
  /** How many sources its cards are made from; with 0, "Generate from sources" is refused. */
  source_count: number
  generation_status: GenerationStatus
  /** 0–100 */
  mastery: number
  /** Cards that aren't paused and are due by the end of today. */
  due_cards: number
  /** YYYY-MM-DD, the first day a card is due; null when it's new or has no cards. */
  next_review_on: string | null
  /** Never practised: no card reviews and no graded answers yet. */
  is_new: boolean
  /**
   * Fading: it had reached 65% or more, and your expected recall is now below 65%. Something you're
   * still learning isn't slipping, it just isn't there yet.
   */
  slipping: boolean
  facets: Record<FacetKey, FacetProgress>
}

export interface Topic {
  id: number
  title: string
  description: string | null
  notes: string | null
  category: Category
  /** Each part is null for a topic added by hand. */
  goal: Goal
  /** In order. */
  subtopics: Subtopic[]
  created_at: string
}

/**
 * Where a source came from (`../API.md`, "A subtopic's sources"): the tutor's notes from the chat,
 * your own notes, or the part of a file you attached in the chat.
 */
export type SourceType = 'tutor' | 'own' | 'file'

/** One of the things a subtopic's flashcards and questions are made from. */
export interface SubtopicSource {
  id: number
  type: SourceType
  /** Markdown, at most 10,000 characters. */
  content: string
  /** The file it's a part of, for a `file` source; the file itself can't be downloaded. */
  material: { id: number; original_filename: string } | null
  updated_at: string
}

/** One subtopic as the subtopic page loads it, with its topic and how much material it has. */
export interface SubtopicDetail extends Subtopic {
  topic: { id: number; title: string; category: Category }
  counts: { flashcards: number; questions: number; sessions: number }
  /** In the API's order: the tutor's notes, your notes, then the files in upload order. */
  sources: SubtopicSource[]
}

/** A topic form: name a new category with `categoryName` instead of picking one. */
export interface TopicInput {
  title: string
  description: string
  notes: string
  categoryId: number | null
  categoryName: string
}

export interface SubtopicInput {
  topicId: number
  title: string
  description: string
  notes: string
}

/** A subtopic Sprout suggests from a topic's source (`POST /topics/{id}/subtopic-suggestions`). */
export interface SubtopicSuggestion {
  title: string
  /** One line on what it covers; null when the AI gave none. */
  description: string | null
  /** The part of the source it covers, in Markdown; null for a topic without notes (no cards). */
  notes: string | null
}

/** What adding several subtopics at once answers (`POST /topics/{id}/subtopics`). */
export interface AddedSubtopics {
  /** Only the added ones, in order. */
  subtopics: Subtopic[]
  added: { subtopics: number }
}

/** What adding, editing or generating for a subtopic answers; its material comes afterwards. */
export interface SubtopicSaveResult {
  subtopic: Subtopic
}

// Empty text clears a field: the API takes the whole form (PUT) and null means "nothing".
function emptyAsNull(text: string): string | null {
  return text === '' ? null : text
}

function topicBody(input: TopicInput): Record<string, unknown> {
  return {
    title: input.title,
    description: emptyAsNull(input.description),
    notes: emptyAsNull(input.notes),
    ...(input.categoryId === null
      ? { category_name: input.categoryName }
      : { category_id: input.categoryId }),
  }
}

function subtopicBody(input: SubtopicInput): Record<string, unknown> {
  return {
    topic_id: input.topicId,
    title: input.title,
    description: emptyAsNull(input.description),
    notes: emptyAsNull(input.notes),
  }
}

export const useTopicsStore = defineStore('topics', () => {
  const categories = ref<Category[]>([])
  const topics = ref<Topic[]>([])
  /** The subtopic the subtopic page shows. */
  const subtopic = ref<SubtopicDetail | null>(null)

  async function fetchLibrary(): Promise<void> {
    const [fetchedTopics, fetchedCategories] = await Promise.all([
      api<Topic[]>('/topics'),
      api<Category[]>('/categories'),
    ])
    topics.value = fetchedTopics
    categories.value = fetchedCategories
  }

  /** Asks for the library again, e.g. to see whether material in the background is done. */
  async function fetchTopics(): Promise<void> {
    topics.value = await api<Topic[]>('/topics')
  }

  async function fetchCategories(): Promise<void> {
    categories.value = await api<Category[]>('/categories')
  }

  // A topic saved with a new category name brings that category along.
  function rememberCategory(category: Category): void {
    if (!categories.value.some((existing) => existing.id === category.id)) {
      categories.value.push(category)
    }
  }

  async function addTopic(input: TopicInput): Promise<Topic> {
    const topic = await api<Topic>('/topics', { method: 'POST', body: topicBody(input) })
    topics.value.push(topic)
    rememberCategory(topic.category)

    return topic
  }

  async function updateTopic(topicId: number, input: TopicInput): Promise<Topic> {
    const topic = await api<Topic>(`/topics/${topicId}`, { method: 'PUT', body: topicBody(input) })
    topics.value = topics.value.map((existing) => (existing.id === topic.id ? topic : existing))
    rememberCategory(topic.category)

    return topic
  }

  // Puts a saved subtopic where the API says it belongs: in place, or at the end of its new topic.
  function placeSubtopic(saved: Subtopic): void {
    for (const topic of topics.value) {
      const index = topic.subtopics.findIndex((existing) => existing.id === saved.id)
      if (index === -1) {
        continue
      }
      if (topic.id === saved.topic_id) {
        topic.subtopics[index] = saved

        return
      }
      topic.subtopics.splice(index, 1)
    }

    topics.value.find((topic) => topic.id === saved.topic_id)?.subtopics.push(saved)
  }

  /** Adds a subtopic; with notes, Sprout makes its flashcards and questions in the background. */
  async function addSubtopic(input: SubtopicInput): Promise<SubtopicSaveResult> {
    const result = await api<SubtopicSaveResult>('/subtopics', {
      method: 'POST',
      body: subtopicBody(input),
    })
    placeSubtopic(result.subtopic)

    return result
  }

  /** Edits a subtopic; a different topic moves it, changed notes make material in the background. */
  async function updateSubtopic(
    subtopicId: number,
    input: SubtopicInput,
  ): Promise<SubtopicSaveResult> {
    const result = await api<SubtopicSaveResult>(`/subtopics/${subtopicId}`, {
      method: 'PUT',
      body: subtopicBody(input),
    })
    placeSubtopic(result.subtopic)

    return result
  }

  async function fetchSubtopic(subtopicId: number): Promise<SubtopicDetail> {
    const fetchedSubtopic = await api<SubtopicDetail>(`/subtopics/${subtopicId}`)
    subtopic.value = fetchedSubtopic

    return fetchedSubtopic
  }

  /**
   * Deletes a topic with its subtopics and everything about them. Can't be undone. Its chats and
   * practice sessions go too; their stores forget them with `forgetTopic`.
   */
  async function deleteTopic(topicId: number): Promise<void> {
    try {
      await api<null>(`/topics/${topicId}`, { method: 'DELETE' })
    } catch (caught) {
      // A 404 means it's already gone (deleted elsewhere): what you asked for, so carry on.
      if (!(caught instanceof ApiError) || caught.status !== 404) {
        throw caught
      }
    }

    topics.value = topics.value.filter((topic) => topic.id !== topicId)
    if (subtopic.value?.topic_id === topicId) {
      subtopic.value = null
    }
  }

  /** Deletes a subtopic with its cards, questions and progress. Can't be undone. */
  async function deleteSubtopic(subtopicId: number): Promise<void> {
    try {
      await api<null>(`/subtopics/${subtopicId}`, { method: 'DELETE' })
    } catch (caught) {
      // A 404 means it's already gone (deleted elsewhere): what you asked for, so carry on.
      if (!(caught instanceof ApiError) || caught.status !== 404) {
        throw caught
      }
    }

    for (const topic of topics.value) {
      topic.subtopics = topic.subtopics.filter((existing) => existing.id !== subtopicId)
    }
    if (subtopic.value?.id === subtopicId) {
      subtopic.value = null
    }
  }

  /**
   * Removes one of a subtopic's sources; its cards and questions stay. Fetch the subtopic again for
   * the new `sources`, `source_count` and (after removing your own notes) `notes`.
   */
  async function removeSource(subtopicId: number, sourceId: number): Promise<void> {
    await api<null>(`/subtopics/${subtopicId}/sources/${sourceId}`, { method: 'DELETE' })
  }

  /** Asks the AI how the topic's saved description and notes split into subtopics. Saves nothing. */
  async function suggestSubtopics(topicId: number): Promise<SubtopicSuggestion[]> {
    const result = await api<{ suggestions: SubtopicSuggestion[] }>(
      `/topics/${topicId}/subtopic-suggestions`,
      { method: 'POST' },
    )

    return result.suggestions
  }

  /** Adds the subtopics you kept, at the end of the topic; the ones with notes get cards later. */
  async function addSubtopics(
    topicId: number,
    subtopics: SubtopicSuggestion[],
  ): Promise<AddedSubtopics> {
    const result = await api<AddedSubtopics>(`/topics/${topicId}/subtopics`, {
      method: 'POST',
      body: { subtopics },
    })
    topics.value.find((topic) => topic.id === topicId)?.subtopics.push(...result.subtopics)

    return result
  }

  /**
   * Queues cards and questions from all sources that the existing ones don't cover (202). Also how
   * a `failed` subtopic is tried again. The subtopic comes back `generating`.
   */
  async function generateMaterial(subtopicId: number): Promise<SubtopicSaveResult> {
    const result = await api<SubtopicSaveResult>(`/subtopics/${subtopicId}/generate`, {
      method: 'POST',
    })
    placeSubtopic(result.subtopic)
    // The subtopic page shows the new status straight away, without asking for it again.
    if (subtopic.value?.id === result.subtopic.id) {
      subtopic.value = { ...subtopic.value, ...result.subtopic }
    }

    return result
  }

  return {
    categories,
    topics,
    subtopic,
    fetchLibrary,
    fetchTopics,
    fetchCategories,
    addTopic,
    updateTopic,
    addSubtopic,
    updateSubtopic,
    fetchSubtopic,
    deleteTopic,
    deleteSubtopic,
    removeSource,
    generateMaterial,
    suggestSubtopics,
    addSubtopics,
  }
})
