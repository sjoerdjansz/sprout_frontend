import { onBeforeUnmount, ref, type Ref } from 'vue'
import { ApiError } from '@/lib/api'

export interface UndoableDelete {
  /** Identifies what's being deleted ("card-12"), so the page can hide it in the meantime. */
  key: string
  /** The toast's title ("Card deleted"). */
  title: string
  /** Sends the delete. */
  run: () => Promise<void>
}

// How long the undo toast stays before the delete is sent (../specs/subtopic-page.md).
export const undoWindow = 6000

/**
 * Deletes that wait for you to change your mind. `schedule` hides the item at once and sends the
 * delete when the undo window has passed, when you delete something else (one toast at a time) or
 * when you leave the page. Deletes stay hard in the API, so undo is only possible before sending.
 */
export function useUndoableDelete(onError: (error: ApiError) => void): {
  pending: Ref<UndoableDelete | null>
  isHidden: (key: string) => boolean
  schedule: (item: UndoableDelete) => void
  undo: () => void
  /** Sends the waiting delete now, for when the page moves on to something else. */
  flush: () => void
} {
  /** The delete you can still undo. */
  const pending = ref<UndoableDelete | null>(null)
  // Waiting or on its way: either way the item shouldn't show.
  const hiddenKeys = ref(new Set<string>())
  let timer: ReturnType<typeof setTimeout> | undefined

  function isHidden(key: string): boolean {
    return hiddenKeys.value.has(key)
  }

  async function send(item: UndoableDelete): Promise<void> {
    try {
      await item.run()
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      // Nothing was deleted, so the item comes back with the reason.
      onError(caught)
    } finally {
      hiddenKeys.value.delete(item.key)
    }
  }

  function sendPending(): void {
    clearTimeout(timer)
    const item = pending.value
    if (item === null) {
      return
    }
    pending.value = null
    void send(item)
  }

  function schedule(item: UndoableDelete): void {
    sendPending()
    pending.value = item
    hiddenKeys.value.add(item.key)
    timer = setTimeout(sendPending, undoWindow)
  }

  function undo(): void {
    clearTimeout(timer)
    if (pending.value !== null) {
      hiddenKeys.value.delete(pending.value.key)
    }
    pending.value = null
  }

  onBeforeUnmount(sendPending)

  return { pending, isHidden, schedule, undo, flush: sendPending }
}
