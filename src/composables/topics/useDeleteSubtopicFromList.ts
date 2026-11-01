import { ref, type Ref } from 'vue'
import type { Toast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { useTopicsStore, type Subtopic } from '@/stores/topics'

/**
 * Deleting a subtopic from its row's menu, after you confirm it in a dialog. The subtopic page has
 * its own (`composables/subtopic/useDeleteSubtopic`), which goes back to the topics page afterwards.
 */
export function useDeleteSubtopicFromList(showToast: (toast: Toast) => void): {
  /** The subtopic you're asked to confirm; null while the dialog is closed. */
  subtopic: Ref<Subtopic | null>
  deleting: Ref<boolean>
  /** Why deleting failed; nothing was deleted. */
  error: Ref<string | null>
  open: (subtopicId: number) => void
  close: () => void
  confirm: () => Promise<void>
} {
  const topicsStore = useTopicsStore()

  const subtopic = ref<Subtopic | null>(null)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  function open(subtopicId: number): void {
    subtopic.value =
      topicsStore.topics
        .flatMap((topic) => topic.subtopics)
        .find((candidate) => candidate.id === subtopicId) ?? null
    error.value = null
  }

  function close(): void {
    subtopic.value = null
  }

  async function confirm(): Promise<void> {
    const deletedSubtopic = subtopic.value
    if (deletedSubtopic === null) {
      return
    }
    deleting.value = true
    error.value = null

    try {
      await topicsStore.deleteSubtopic(deletedSubtopic.id)
      subtopic.value = null
      showToast({ title: `Deleted ${deletedSubtopic.title}`, tone: 'sky', icon: 'trash-2' })
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      error.value = caught.message
    } finally {
      deleting.value = false
    }
  }

  return { subtopic, deleting, error, open, close, confirm }
}
