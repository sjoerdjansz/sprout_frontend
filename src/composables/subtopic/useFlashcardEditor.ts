import { ref, type Ref } from 'vue'
import type { CardEditorTarget } from '@/components/subtopic/FlashcardsPanel.vue'
import type { SubtopicPageActions } from '@/composables/subtopic/useSubtopicLoader'
import { ApiError } from '@/lib/api'
import { useFlashcardsStore, type Flashcard, type FlashcardInput } from '@/stores/flashcards'

/** Writing, editing and pausing cards on the subtopic page. */
export function useFlashcardEditor(actions: SubtopicPageActions): {
  /** The card the editor is open for, 'new', or null when it's closed. */
  editing: Ref<CardEditorTarget | null>
  saving: Ref<boolean>
  /** Why the last save failed; the editor keeps your text. */
  error: Ref<ApiError | null>
  open: (target: CardEditorTarget) => void
  close: () => void
  save: (input: FlashcardInput) => Promise<void>
  togglePause: (card: Flashcard) => Promise<void>
} {
  const flashcardsStore = useFlashcardsStore()

  const editing = ref<CardEditorTarget | null>(null)
  const saving = ref(false)
  const error = ref<ApiError | null>(null)

  function open(target: CardEditorTarget): void {
    error.value = null
    editing.value = target
  }

  function close(): void {
    editing.value = null
  }

  async function save(input: FlashcardInput): Promise<void> {
    const target = editing.value
    if (target === null) {
      return
    }
    saving.value = true
    error.value = null

    try {
      if (target === 'new') {
        await flashcardsStore.addFlashcard(actions.subtopicId(), input)
      } else {
        await flashcardsStore.editFlashcard(target, input)
      }
      close()
      void actions.refreshHeader()
    } catch (caught) {
      if (caught instanceof ApiError && caught.status !== 404) {
        // Nothing was saved; the editor keeps your text so you can fix it.
        error.value = caught
      } else {
        close()
        actions.failAction(caught)
      }
    } finally {
      saving.value = false
    }
  }

  async function togglePause(card: Flashcard): Promise<void> {
    actions.clearActionError()

    try {
      await flashcardsStore.setPaused(card.id, !card.paused)
      void actions.refreshHeader()
    } catch (caught) {
      actions.failAction(caught)
    }
  }

  return { editing, saving, error, open, close, save, togglePause }
}
