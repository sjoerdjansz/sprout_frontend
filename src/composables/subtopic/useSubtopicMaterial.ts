import { computed, type ComputedRef, type Ref } from 'vue'
import type { SubtopicPageActions } from '@/composables/subtopic/useSubtopicLoader'
import { useUndoableDelete, type UndoableDelete } from '@/composables/useUndoableDelete'
import { useFlashcardsStore, type Flashcard } from '@/stores/flashcards'
import { usePracticeStore, type PracticeSession } from '@/stores/practice'
import { useQuestionsStore, type Question } from '@/stores/questions'
import { useTopicsStore, type SubtopicDetail, type SubtopicSource } from '@/stores/topics'

/**
 * The subtopic's material as the page shows it, and deleting it with a few seconds to undo.
 * What's waiting to be deleted is hidden straight away, so you see the result of your click.
 */
export function useSubtopicMaterial(
  subtopic: Ref<SubtopicDetail | null>,
  actions: SubtopicPageActions,
): {
  cards: ComputedRef<Flashcard[]>
  questions: ComputedRef<Question[]>
  sessions: ComputedRef<PracticeSession[]>
  /** What the cards are made from, in the API's order, without one that's being removed. */
  sources: ComputedRef<SubtopicSource[]>
  pending: Ref<UndoableDelete | null>
  undo: () => void
  flush: () => void
  removeCard: (card: Flashcard) => void
  removeQuestion: (question: Question) => void
  removeSource: (source: SubtopicSource) => void
} {
  const topicsStore = useTopicsStore()
  const flashcardsStore = useFlashcardsStore()
  const questionsStore = useQuestionsStore()
  const practiceStore = usePracticeStore()
  const { pending, isHidden, schedule, undo, flush } = useUndoableDelete(actions.failAction)

  const cards = computed<Flashcard[]>(() =>
    flashcardsStore.flashcards.filter((card) => !isHidden(`card-${card.id}`)),
  )
  const questions = computed<Question[]>(() =>
    questionsStore.questions.filter((question) => !isHidden(`question-${question.id}`)),
  )
  // Practice sessions are a record of what you did, so they can't be deleted.
  const sessions = computed<PracticeSession[]>(() => practiceStore.subtopicSessions)
  const sources = computed<SubtopicSource[]>(() =>
    (subtopic.value?.sources ?? []).filter((source) => !isHidden(`source-${source.id}`)),
  )

  function removeCard(card: Flashcard): void {
    schedule({
      key: `card-${card.id}`,
      title: 'Card deleted',
      run: async () => {
        await flashcardsStore.deleteFlashcard(card.id)
        await actions.refreshHeader()
      },
    })
  }

  function removeQuestion(question: Question): void {
    schedule({
      key: `question-${question.id}`,
      title: 'Question deleted',
      run: async () => {
        await questionsStore.deleteQuestion(question.id)
        await actions.refreshHeader()
      },
    })
  }

  // The cards and questions made from a source stay: they don't remember where they came from.
  // Fetching the subtopic again brings the new source count, and `notes` when it was your own.
  // A 404 (already gone) reloads the page without an error, through `failAction`.
  function removeSource(source: SubtopicSource): void {
    const subtopicId = actions.subtopicId()

    schedule({
      key: `source-${source.id}`,
      title: 'Source removed',
      message: 'Its cards and questions stay. You can still undo this.',
      run: async () => {
        await topicsStore.removeSource(subtopicId, source.id)
        await actions.refreshHeader()
      },
    })
  }

  return {
    cards,
    questions,
    sessions,
    sources,
    pending,
    undo,
    flush,
    removeCard,
    removeQuestion,
    removeSource,
  }
}
