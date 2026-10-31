import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { SubtopicPageActions } from '@/composables/subtopic/useSubtopicLoader'
import { useGenerationPolling } from '@/composables/useGenerationPolling'
import type { Toast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { pluralize } from '@/lib/knowledgeMap'
import { useFlashcardsStore } from '@/stores/flashcards'
import { useQuestionsStore } from '@/stores/questions'
import { useTopicsStore, type GenerationStatus, type SubtopicDetail } from '@/stores/topics'

/** How much of the subtopic's material Sprout made (not the cards you wrote yourself). */
interface MadeBySprout {
  flashcards: number
  questions: number
}

/** The toast once Sprout is done: what it added, or that the sources were already covered. */
export function addedMaterialToast(added: MadeBySprout): Toast {
  if (added.flashcards + added.questions === 0) {
    return {
      title: 'Nothing new to add',
      message: 'Your sources are already covered.',
      tone: 'sprout',
      icon: 'check',
    }
  }
  const flashcards = pluralize(added.flashcards, 'flashcard')
  const questions = pluralize(added.questions, 'question')

  return { title: `Added ${flashcards} and ${questions}`, tone: 'sprout', icon: 'sparkles' }
}

/**
 * The subtopic's material made in the background (`../specs/background-generation.md`): asking
 * again while it's generating, showing the new cards and questions once it's ready (with a toast of
 * what was added), and "Generate from sources", which is also how a failed subtopic is tried again.
 */
export function useGenerateMaterial(
  subtopic: Ref<SubtopicDetail | null>,
  actions: SubtopicPageActions,
  showToast: (toast: Toast) => void,
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

  function countMadeBySprout(): MadeBySprout {
    return {
      flashcards: flashcardsStore.flashcards.filter((card) => card.origin === 'ai').length,
      questions: questionsStore.questions.filter((question) => question.origin === 'ai').length,
    }
  }

  // Sprout's material while it was generating, to tell what it added once it's ready. The API
  // doesn't count it any more (the material doesn't exist yet when it answers), so the page does.
  let before: MadeBySprout | null = null

  async function refresh(): Promise<void> {
    const subtopicId = actions.subtopicId()
    // The first ask comes a few seconds after the page loaded, so the lists are there by now.
    before ??= countMadeBySprout()
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

    if (fresh.generation_status === 'generating') {
      return
    }
    const madeBefore = before
    before = null
    // Failed: the failed notice says so, and nothing was added.
    if (fresh.generation_status === 'failed') {
      return
    }

    await Promise.all([
      flashcardsStore.fetchFlashcards(subtopicId),
      questionsStore.fetchQuestions(subtopicId),
    ])
    const madeNow = countMadeBySprout()
    // Below zero when you deleted some of Sprout's cards in the meantime.
    showToast(
      addedMaterialToast({
        flashcards: Math.max(0, madeNow.flashcards - madeBefore.flashcards),
        questions: Math.max(0, madeNow.questions - madeBefore.questions),
      }),
    )
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
