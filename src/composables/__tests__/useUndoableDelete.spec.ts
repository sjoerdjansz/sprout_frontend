import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { ApiError } from '@/lib/api'
import { undoWindow, useUndoableDelete } from '../useUndoableDelete'

type Undoable = ReturnType<typeof useUndoableDelete>

// The composable needs a component around it for its unmount hook.
function mountUndoable(onError: (error: ApiError) => void = vi.fn<(error: ApiError) => void>()): {
  wrapper: VueWrapper
  undoable: Undoable
} {
  let undoable: Undoable | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        undoable = useUndoableDelete(onError)

        return () => h('div')
      },
    }),
  )
  if (undoable === undefined) {
    throw new Error('The composable did not run.')
  }

  return { wrapper, undoable }
}

describe('useUndoableDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hides the item at once and only sends the delete when the undo window has passed', async () => {
    const run = vi.fn<() => Promise<void>>().mockResolvedValue()
    const { undoable } = mountUndoable()

    undoable.schedule({ key: 'card-1', title: 'Card deleted', run })
    expect(undoable.isHidden('card-1')).toBe(true)
    expect(undoable.pending.value?.title).toBe('Card deleted')

    vi.advanceTimersByTime(undoWindow - 1)
    expect(run).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(run).toHaveBeenCalledOnce()
    expect(undoable.pending.value).toBeNull()
  })

  it('brings the item back on undo and never sends the delete', () => {
    const run = vi.fn<() => Promise<void>>().mockResolvedValue()
    const { undoable } = mountUndoable()

    undoable.schedule({ key: 'card-1', title: 'Card deleted', run })
    undoable.undo()
    vi.advanceTimersByTime(undoWindow)

    expect(undoable.isHidden('card-1')).toBe(false)
    expect(run).not.toHaveBeenCalled()
  })

  it('sends the waiting delete straight away when you delete something else', () => {
    const first = vi.fn<() => Promise<void>>().mockResolvedValue()
    const second = vi.fn<() => Promise<void>>().mockResolvedValue()
    const { undoable } = mountUndoable()

    undoable.schedule({ key: 'card-1', title: 'Card deleted', run: first })
    undoable.schedule({ key: 'card-2', title: 'Card deleted', run: second })

    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
    expect(undoable.pending.value?.key).toBe('card-2')
  })

  it('sends the waiting delete when you leave the page', () => {
    const run = vi.fn<() => Promise<void>>().mockResolvedValue()
    const { wrapper, undoable } = mountUndoable()

    undoable.schedule({ key: 'card-1', title: 'Card deleted', run })
    wrapper.unmount()

    expect(run).toHaveBeenCalledOnce()
  })

  it('shows the item again with the reason when the delete fails', async () => {
    const onError = vi.fn<(error: ApiError) => void>()
    const run = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new ApiError(0, "Can't reach Sprout right now."))
    const { undoable } = mountUndoable(onError)

    undoable.schedule({ key: 'card-1', title: 'Card deleted', run })
    undoable.flush()
    await flushPromises()

    expect(undoable.isHidden('card-1')).toBe(false)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ status: 0 }))
  })
})
