import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/lib/api'
import { useTopicsStore } from '@/stores/topics'

/** Deleting the whole subtopic after you confirm it, then going back to the knowledge map. */
export function useDeleteSubtopic(
  subtopicId: () => number,
  /** Drops deletes still waiting for their undo window: they go with the subtopic anyway. */
  dropPendingDeletes: () => void,
): {
  isOpen: Ref<boolean>
  deleting: Ref<boolean>
  /** Why deleting failed; nothing was deleted. */
  error: Ref<string | null>
  open: () => void
  close: () => void
  confirm: () => Promise<void>
} {
  const router = useRouter()
  const topicsStore = useTopicsStore()

  const isOpen = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  function open(): void {
    error.value = null
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
  }

  async function confirm(): Promise<void> {
    dropPendingDeletes()
    deleting.value = true
    error.value = null

    try {
      await topicsStore.deleteSubtopic(subtopicId())
      await router.push({ name: 'knowledge-map' })
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      // Already gone (deleted elsewhere): the knowledge map is where you'd end up anyway.
      if (caught.status === 404) {
        await router.push({ name: 'knowledge-map' })

        return
      }
      error.value = caught.message
    } finally {
      deleting.value = false
    }
  }

  return { isOpen, deleting, error, open, close, confirm }
}
