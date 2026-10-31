import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { ApiError } from '@/lib/api'

// How often to ask again while Sprout makes cards in the background (../specs/background-generation.md).
export const pollInterval = 3000
// Material usually takes seconds, at most a couple of minutes. Waiting longer than this most likely
// means no worker is running, so ask far less often instead of every few seconds forever.
export const slowDownAfter = 3 * 60_000
export const slowPollInterval = 30_000

/**
 * Asks again every few seconds while something on the screen is still `generating`, and stops as
 * soon as nothing is or the screen goes away. One timer per screen, however many subtopics are
 * generating. A failed ask doesn't stop it: the error shows and the next ask follows as planned.
 */
export function useGenerationPolling(
  /** Whether anything on the screen is still generating; read reactively. */
  isGenerating: () => boolean,
  /** Fetches the screen's data again through its stores. */
  refresh: () => Promise<void>,
): {
  /** Why the last ask failed; null once one works again. */
  error: Ref<string | null>
} {
  const error = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let asking = false
  let startedAt: number | null = null
  let disposed = false

  function scheduleNext(): void {
    startedAt ??= Date.now()
    const waited = Date.now() - startedAt
    timer = setTimeout(() => void ask(), waited < slowDownAfter ? pollInterval : slowPollInterval)
  }

  function stop(): void {
    clearTimeout(timer)
    timer = undefined
    startedAt = null
    error.value = null
  }

  async function ask(): Promise<void> {
    timer = undefined
    asking = true

    try {
      await refresh()
      error.value = null
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      error.value = caught.message
    } finally {
      asking = false
    }

    if (disposed) {
      return
    }
    if (isGenerating()) {
      scheduleNext()
    } else {
      stop()
    }
  }

  watch(
    isGenerating,
    (generating) => {
      // While an ask is on its way, it plans the next one itself when it's back.
      if (generating && timer === undefined && !asking) {
        scheduleNext()
      } else if (!generating && !asking) {
        stop()
      }
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
  })

  return { error }
}
