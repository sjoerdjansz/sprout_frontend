import { ref, type Ref } from 'vue'
import type { SubtopicPageActions } from '@/composables/subtopic/useSubtopicLoader'
import type { Toast } from '@/composables/useToast'
import { describeAdded } from '@/lib/knowledgeMap'
import { useFlashcardsStore } from '@/stores/flashcards'
import { useQuestionsStore } from '@/stores/questions'
import { useTopicsStore, type AddedMaterial } from '@/stores/topics'

/** The toast after Sprout made material from the notes: what it added, or that nothing was new. */
export function addedMaterialToast(added: AddedMaterial): Toast {
  return added.flashcards + added.questions === 0
    ? {
        title: 'Nothing new to add',
        message: 'Your notes are already covered.',
        tone: 'sprout',
        icon: 'check',
      }
    : { title: `Added ${describeAdded(added)}`, tone: 'sprout', icon: 'sparkles' }
}

/** "Generate from sources": more cards and questions from the notes. */
export function useGenerateMaterial(
  actions: SubtopicPageActions,
  showToast: (toast: Toast) => void,
): { generating: Ref<boolean>; generate: () => Promise<void> } {
  const topicsStore = useTopicsStore()
  const flashcardsStore = useFlashcardsStore()
  const questionsStore = useQuestionsStore()

  const generating = ref(false)

  async function generate(): Promise<void> {
    const subtopicId = actions.subtopicId()
    actions.clearActionError()
    generating.value = true

    try {
      const result = await topicsStore.generateMaterial(subtopicId)
      await Promise.all([
        flashcardsStore.fetchFlashcards(subtopicId),
        questionsStore.fetchQuestions(subtopicId),
        topicsStore.fetchSubtopic(subtopicId),
      ])
      showToast(addedMaterialToast(result.added))
    } catch (caught) {
      actions.failAction(caught)
    } finally {
      generating.value = false
    }
  }

  return { generating, generate }
}
