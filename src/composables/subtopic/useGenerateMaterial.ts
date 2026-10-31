import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { SubtopicPageActions } from '@/composables/subtopic/useSubtopicLoader'
import { useGenerationPolling } from '@/composables/useGenerationPolling'
import { ApiError } from '@/lib/api'
import { useFlashcardsStore } from '@/stores/flashcards'
import { useQuestionsStore } from '@/stores/questions'
import { useTopicsStore, type GenerationStatus, type SubtopicDetail } from '@/stores/topics'

/**
 * The subtopic's material made in the background (`../specs/background-generation.md`): asking
 * again while it's generating, showing the new cards and questions once it's ready, and "Generate
 * from sources", which is also how a failed subtopic is tried again.
 */
export function useGenerateMaterial(
  subtopic: Ref<SubtopicDetail | null>,
  actions: SubtopicPageActions,
): {
  /** Null until the subtopic is loaded. */
  status: ComputedRef<GenerationStatus | null>
  /** While the request is on its way or Sprout is making the material: no second request. */
  generating: ComputedRef<boolean>
  /** Why asking for the status failed; Sprout keeps asking. */
  checkError: Ref<string | null>
  generate: () => Promise<void>
} {
  const topicsStore = useTopicsStore()
  const flashcardsStore = useFlashcardsStore()
  const questionsStore = useQuestionsStore()

  const sending = ref(false)

  const status = computed<GenerationStatus | null>(() => subtopic.value?.generation_status ?? null)
  const generating = computed<boolean>(() => sending.value || status.value === 'generating')

  async function refresh(): Promise<void> {
    const subtopicId = actions.subtopicId()
    let fresh: SubtopicDetail
    try {
      fresh = await topicsStore.fetchSubtopic(subtopicId)
    } catch (caught) {
      // Deleted elsewhere: the page becomes the not found page, which stops the asking.
      if (caught instanceof ApiError && caught.status === 404) {
        actions.failAction(caught)

        return
      }
      throw caught
    }

    if (fresh.generation_status === 'ready') {
      await Promise.all([
        flashcardsStore.fetchFlashcards(subtopicId),
        questionsStore.fetchQuestions(subtopicId),
      ])
    }
  }

  const { error: checkError } = useGenerationPolling(() => status.value === 'generating', refresh)

  async function generate(): Promise<void> {
    actions.clearActionError()
    sending.value = true

    try {
      // Answers 202 with the subtopic generating; the polling takes it from there.
      await topicsStore.generateMaterial(actions.subtopicId())
    } catch (caught) {
      actions.failAction(caught)
      // Already generating (asked for elsewhere, or a double click): show that status too.
      if (caught instanceof ApiError && caught.fieldError('subtopic') !== undefined) {
        await actions.refreshHeader()
      }
    } finally {
      sending.value = false
    }
  }

  return { status, generating, checkError, generate }
}
