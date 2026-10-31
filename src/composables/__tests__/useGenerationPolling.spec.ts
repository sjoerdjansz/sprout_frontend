import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { ApiError } from '@/lib/api'
import {
  pollInterval,
  slowDownAfter,
  slowPollInterval,
  useGenerationPolling,
} from '../useGenerationPolling'

type Polling = ReturnType<typeof useGenerationPolling>

// The composable needs a component around it to stop when it unmounts.
function mountPolling(
  generating: Ref<boolean>,
  refresh: () => Promise<void>,
): { wrapper: VueWrapper; polling: Polling } {
  let polling: Polling | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        polling = useGenerationPolling(() => generating.value, refresh)

        return () => h('div')
      },
    }),
  )
  if (polling === undefined) {
    throw new Error('The composable did not run.')
  }

  return { wrapper, polling }
}

describe('useGenerationPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks again every few seconds while something is generating, and stops when nothing is', async () => {
    const generating = ref(true)
    const refresh = vi.fn<() => Promise<void>>().mockResolvedValue()
    mountPolling(generating, refresh)

    await vi.advanceTimersByTimeAsync(pollInterval - 1)
    expect(refresh).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(pollInterval)
    expect(refresh).toHaveBeenCalledTimes(2)

    // The last ask brought the news: nothing is generating any more.
    refresh.mockImplementation(async () => {
      generating.value = false
    })
    await vi.advanceTimersByTimeAsync(pollInterval)
    await vi.advanceTimersByTimeAsync(pollInterval * 5)
    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('does not ask while nothing is generating, and starts once something is', async () => {
    const generating = ref(false)
    const refresh = vi.fn<() => Promise<void>>().mockResolvedValue()
    mountPolling(generating, refresh)

    await vi.advanceTimersByTimeAsync(pollInterval * 3)
    expect(refresh).not.toHaveBeenCalled()

    generating.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(pollInterval)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('stops asking when the screen goes away', async () => {
    const refresh = vi.fn<() => Promise<void>>().mockResolvedValue()
    const { wrapper } = mountPolling(ref(true), refresh)

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(pollInterval * 3)

    expect(refresh).not.toHaveBeenCalled()
  })

  it('asks far less often after a long wait', async () => {
    const askedAt: number[] = []
    const refresh = vi.fn<() => Promise<void>>().mockImplementation(async () => {
      askedAt.push(Date.now())
    })
    mountPolling(ref(true), refresh)

    await vi.advanceTimersByTimeAsync(slowDownAfter + slowPollInterval * 2)
    const gaps = askedAt.slice(1).map((time, index) => time - (askedAt[index] ?? 0))

    expect(gaps[0]).toBe(pollInterval)
    expect(gaps[gaps.length - 1]).toBe(slowPollInterval)
  })

  it('shows why an ask failed, keeps asking, and clears the error once one works', async () => {
    const refresh = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(
        new ApiError(0, "Can't reach Sprout right now. Check your connection and try again."),
      )
      .mockResolvedValue()
    const { polling } = mountPolling(ref(true), refresh)

    await vi.advanceTimersByTimeAsync(pollInterval)
    expect(polling.error.value).toBe(
      "Can't reach Sprout right now. Check your connection and try again.",
    )

    await vi.advanceTimersByTimeAsync(pollInterval)
    expect(refresh).toHaveBeenCalledTimes(2)
    expect(polling.error.value).toBeNull()
  })
})
