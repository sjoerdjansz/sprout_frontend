import { computed, type ComputedRef, type Ref } from 'vue'
import type { SubtopicPageActions } from '@/composables/subtopic/useSubtopicLoader'
import { useUndoableDelete, type UndoableDelete } from '@/composables/useUndoableDelete'
import { useConversationsStore, type ConversationListItem } from '@/stores/conversations'
import { useFlashcardsStore, type Flashcard } from '@/stores/flashcards'
import { useQuestionsStore, type Question } from '@/stores/questions'
import { useTopicsStore, type SubtopicDetail } from '@/stores/topics'

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
  sessions: ComputedRef<ConversationListItem[]>
  /** The only source for now; null when there are none (or they're being removed). */
  notes: ComputedRef<string | null>
  pending: Ref<UndoableDelete | null>
  undo: () => void
  flush: () => void
  removeCard: (card: Flashcard) => void
  removeQuestion: (question: Question) => void
  removeSession: (session: ConversationListItem) => void
  removeNotes: () => void
} {
  const topicsStore = useTopicsStore()
  const flashcardsStore = useFlashcardsStore()
  const questionsStore = useQuestionsStore()
  const conversationsStore = useConversationsStore()
  const { pending, isHidden, schedule, undo, flush } = useUndoableDelete(actions.failAction)

  const cards = computed<Flashcard[]>(() =>
    flashcardsStore.flashcards.filter((card) => !isHidden(`card-${card.id}`)),
  )
  const questions = computed<Question[]>(() =>
    questionsStore.questions.filter((question) => !isHidden(`question-${question.id}`)),
  )
  const sessions = computed<ConversationListItem[]>(() =>
    conversationsStore.topicConversations.filter((session) => !isHidden(`session-${session.id}`)),
  )
  const notes = computed<string | null>(() =>
    subtopic.value?.notes && !isHidden('notes') ? subtopic.value.notes : null,
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

  function removeSession(session: ConversationListItem): void {
    schedule({
      key: `session-${session.id}`,
      title: 'Session deleted',
      run: () => conversationsStore.deleteConversation(session.id),
    })
  }

  // Removing the only source clears the notes; the cards and questions made from them stay.
  function removeNotes(): void {
    const current = subtopic.value
    if (current === null) {
      return
    }

    schedule({
      key: 'notes',
      title: 'Source removed',
      run: async () => {
        await topicsStore.updateSubtopic(current.id, {
          topicId: current.topic.id,
          title: current.title,
          description: current.description ?? '',
          notes: '',
        })
        await actions.refreshHeader()
      },
    })
  }

  return {
    cards,
    questions,
    sessions,
    notes,
    pending,
    undo,
    flush,
    removeCard,
    removeQuestion,
    removeSession,
    removeNotes,
  }
}
