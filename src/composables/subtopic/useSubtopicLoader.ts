import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { ApiError } from '@/lib/api'
import { useConversationsStore } from '@/stores/conversations'
import { useFlashcardsStore } from '@/stores/flashcards'
import { useQuestionsStore } from '@/stores/questions'
import { useTopicsStore, type SubtopicDetail } from '@/stores/topics'

export type LoadState = 'loading' | 'loaded' | 'not-found' | 'failed'

/** What the subtopic page's other composables need to report back and keep the page fresh. */
export interface SubtopicPageActions {
  subtopicId: () => number
  /** Shows why an action failed, or the not found page when the subtopic is gone. */
  failAction: (caught: unknown) => void
  /** Fetches the header again after cards or answers changed. */
  refreshHeader: () => Promise<void>
  /** Loads everything again without the loading state. */
  reload: () => Promise<void>
  clearActionError: () => void
}

/**
 * Loads the subtopic page (the subtopic, then its cards, questions and its topic's sessions) and
 * decides what a failed request means for the page.
 */
export function useSubtopicLoader(id: MaybeRefOrGetter<number>): {
  loadState: Ref<LoadState>
  loadError: Ref<string>
  /** Why the last action on the page (pause, generate, delete …) didn't work. */
  actionError: Ref<string | null>
  subtopic: ComputedRef<SubtopicDetail | null>
  load: () => Promise<void>
  actions: SubtopicPageActions
} {
  const topicsStore = useTopicsStore()
  const flashcardsStore = useFlashcardsStore()
  const questionsStore = useQuestionsStore()
  const conversationsStore = useConversationsStore()

  const loadState = ref<LoadState>('loading')
  const loadError = ref('')
  const actionError = ref<string | null>(null)

  // Only the subtopic this page is about, never the one from the page before.
  const subtopic = computed<SubtopicDetail | null>(() =>
    topicsStore.subtopic?.id === toValue(id) ? topicsStore.subtopic : null,
  )

  async function loadAll(showLoading: boolean): Promise<void> {
    const subtopicId = toValue(id)
    if (showLoading) {
      loadState.value = 'loading'
    }

    try {
      const loaded = await topicsStore.fetchSubtopic(subtopicId)
      await Promise.all([
        flashcardsStore.fetchFlashcards(subtopicId),
        questionsStore.fetchQuestions(subtopicId),
        conversationsStore.fetchTopicConversations(loaded.topic.id),
      ])
      loadState.value = 'loaded'
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      if (caught.status === 404) {
        loadState.value = 'not-found'
      } else if (showLoading) {
        loadError.value = caught.message
        loadState.value = 'failed'
      } else {
        actionError.value = caught.message
      }
    }
  }

  /**
   * A 404 can mean the subtopic was deleted elsewhere (then the page becomes the not found page)
   * or only the card or question was: reloading tells which.
   */
  function failAction(caught: unknown): void {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    if (caught.status === 404) {
      void loadAll(false)

      return
    }

    actionError.value = caught.fieldError('notes') ?? caught.fieldError('ai_key') ?? caught.message
  }

  // Cards and answers feed the header's mastery, facets and due count.
  async function refreshHeader(): Promise<void> {
    try {
      await topicsStore.fetchSubtopic(toValue(id))
    } catch (caught) {
      failAction(caught)
    }
  }

  return {
    loadState,
    loadError,
    actionError,
    subtopic,
    load: () => loadAll(true),
    actions: {
      subtopicId: () => toValue(id),
      failAction,
      refreshHeader,
      reload: () => loadAll(false),
      clearActionError: () => {
        actionError.value = null
      },
    },
  }
}
