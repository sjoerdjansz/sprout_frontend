import { ref, type Ref } from 'vue'
import type { Toast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { useConversationsStore } from '@/stores/conversations'
import { usePracticeStore } from '@/stores/practice'
import { useTopicsStore, type Topic } from '@/stores/topics'

/** Deleting a topic from its card's menu, after you confirm it in a dialog. */
export function useDeleteTopic(showToast: (toast: Toast) => void): {
  /** The topic you're asked to confirm; null while the dialog is closed. */
  topic: Ref<Topic | null>
  deleting: Ref<boolean>
  /** Why deleting failed; nothing was deleted. */
  error: Ref<string | null>
  open: (topicId: number) => void
  close: () => void
  confirm: () => Promise<void>
} {
  const topicsStore = useTopicsStore()
  const conversationsStore = useConversationsStore()
  const practiceStore = usePracticeStore()

  const topic = ref<Topic | null>(null)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  function open(topicId: number): void {
    topic.value = topicsStore.topics.find((candidate) => candidate.id === topicId) ?? null
    error.value = null
  }

  function close(): void {
    topic.value = null
  }

  // The API deleted its chats and practice sessions too, so the sidebar and practice forget them.
  function forget(deletedTopic: Topic): void {
    conversationsStore.forgetTopic(deletedTopic.id)
    practiceStore.forgetTopic(deletedTopic.id)
    topic.value = null
    showToast({ title: `Deleted ${deletedTopic.title}`, tone: 'sky', icon: 'trash-2' })
  }

  async function confirm(): Promise<void> {
    const deletedTopic = topic.value
    if (deletedTopic === null) {
      return
    }
    deleting.value = true
    error.value = null

    try {
      await topicsStore.deleteTopic(deletedTopic.id)
      forget(deletedTopic)
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      error.value = caught.message
    } finally {
      deleting.value = false
    }
  }

  return { topic, deleting, error, open, close, confirm }
}
