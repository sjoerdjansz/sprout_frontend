import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { Toast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { describeAdded, pluralize } from '@/lib/knowledgeMap'
import { useTopicsStore, type SubtopicSuggestion, type Topic } from '@/stores/topics'

/** Reading the source, reviewing what Sprout suggests, or adding the ones you kept. */
export type SuggestionsPhase = 'reading' | 'review' | 'adding'

/** One row of the review: a suggestion (or one you added), and whether you keep it. */
export interface SuggestionRow extends SubtopicSuggestion {
  key: number
  keep: boolean
}

export interface SubtopicSuggestions {
  /** The topic being split up; null while the step is closed. */
  topic: Ref<Pick<Topic, 'id' | 'title'> | null>
  phase: Ref<SuggestionsPhase>
  rows: Ref<SuggestionRow[]>
  /** Why reading or adding failed: shown above the buttons, with Try again. */
  error: Ref<ApiError | null>
  /** A row's own error, e.g. a name the topic already has. */
  rowErrors: ComputedRef<Record<number, string>>
  keptCount: ComputedRef<number>
  canAdd: ComputedRef<boolean>
  start: (topic: Pick<Topic, 'id' | 'title'>) => Promise<void>
  retry: () => Promise<void>
  addOwnRow: () => void
  updateRow: (key: number, changes: Partial<Pick<SuggestionRow, 'title' | 'keep'>>) => void
  add: () => Promise<void>
  close: () => void
}

/**
 * "Build a topic from a source" (`../specs/topic-from-source.md`): after a topic with a new or
 * changed source is saved, Sprout suggests the subtopics it falls into; you review them and the
 * ones you keep are added with their cards in one go.
 */
export function useSubtopicSuggestions(showToast: (toast: Toast) => void): SubtopicSuggestions {
  const topicsStore = useTopicsStore()

  const topic = ref<Pick<Topic, 'id' | 'title'> | null>(null)
  const phase = ref<SuggestionsPhase>('reading')
  const rows = ref<SuggestionRow[]>([])
  const error = ref<ApiError | null>(null)
  // The rows sent in the last add, in order: the API's errors point at them by index.
  const sentKeys = ref<number[]>([])
  let nextKey = 0

  const keptRows = computed<SuggestionRow[]>(() => rows.value.filter((row) => row.keep))
  const keptCount = computed<number>(() => keptRows.value.length)
  const canAdd = computed<boolean>(
    () =>
      phase.value === 'review' &&
      keptCount.value > 0 &&
      keptRows.value.every((row) => row.title.trim() !== ''),
  )

  const rowErrors = computed<Record<number, string>>(() => {
    const errors: Record<number, string> = {}
    sentKeys.value.forEach((key, index) => {
      const message = error.value?.fieldError(`subtopics.${index}.title`)
      if (message) {
        errors[key] = message
      }
    })

    return errors
  })

  function close(): void {
    topic.value = null
    rows.value = []
    error.value = null
    sentKeys.value = []
  }

  async function read(): Promise<void> {
    if (topic.value === null) {
      return
    }
    phase.value = 'reading'
    error.value = null

    try {
      const suggestions = await topicsStore.suggestSubtopics(topic.value.id)
      if (suggestions.length === 0) {
        close()
        showToast({
          title: 'Your subtopics already cover this source.',
          tone: 'sky',
          icon: 'check',
        })
        return
      }
      rows.value = suggestions.map((suggestion) => ({ ...suggestion, key: nextKey++, keep: true }))
      phase.value = 'review'
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      // The topic is already saved; you can ask again or skip.
      error.value = caught
    }
  }

  async function start(saved: Pick<Topic, 'id' | 'title'>): Promise<void> {
    topic.value = saved
    rows.value = []
    await read()
  }

  // A failed read asks again; a failed add sends the review again.
  async function retry(): Promise<void> {
    await (phase.value === 'reading' ? read() : add())
  }

  /** A subtopic of your own: without notes, so it gets no cards. */
  function addOwnRow(): void {
    rows.value.push({ key: nextKey++, title: '', description: null, notes: null, keep: true })
  }

  function updateRow(key: number, changes: Partial<Pick<SuggestionRow, 'title' | 'keep'>>): void {
    rows.value = rows.value.map((row) => (row.key === key ? { ...row, ...changes } : row))
  }

  async function add(): Promise<void> {
    const current = topic.value
    if (current === null || !canAdd.value) {
      return
    }
    const kept = keptRows.value
    sentKeys.value = kept.map((row) => row.key)
    phase.value = 'adding'
    error.value = null

    try {
      const result = await topicsStore.addSubtopics(
        current.id,
        kept.map((row) => ({
          title: row.title.trim(),
          description: row.description,
          notes: row.notes,
        })),
      )
      close()
      const madeMaterial = result.added.flashcards + result.added.questions > 0
      showToast({
        title: `Added ${pluralize(result.added.subtopics, 'subtopic')}`,
        message: madeMaterial ? describeAdded(result.added) : undefined,
        tone: 'sprout',
        icon: 'sparkles',
      })
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      // Nothing was added; the review stays so you can fix it or try again.
      error.value = caught
      phase.value = 'review'
    }
  }

  return {
    topic,
    phase,
    rows,
    error,
    rowErrors,
    keptCount,
    canAdd,
    start,
    retry,
    addOwnRow,
    updateRow,
    add,
    close,
  }
}
