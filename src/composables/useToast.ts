import { onBeforeUnmount, ref, type Ref } from 'vue'
import type { IconName } from '@/components/icons'

export interface Toast {
  title: string
  message?: string
  tone: 'sun' | 'sprout' | 'ember' | 'sky'
  icon: IconName
}

// The design system's toasts disappear after 4 seconds.
const toastDuration = 4000

/** One toast at a time for a page: a new one replaces the one that's showing. */
export function useToast(): { toast: Ref<Toast | null>; showToast: (next: Toast) => void } {
  const toast = ref<Toast | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  function showToast(next: Toast): void {
    clearTimeout(timer)
    toast.value = next
    timer = setTimeout(() => {
      toast.value = null
    }, toastDuration)
  }

  onBeforeUnmount(() => {
    clearTimeout(timer)
  })

  return { toast, showToast }
}
