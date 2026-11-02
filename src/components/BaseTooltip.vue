<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const { text, delay = 2000 } = defineProps<{
  text: string
  /** How long the mouse rests on the element before the tooltip shows, in ms. */
  delay?: number
}>()

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

// Mouse only: a touch has no hover, and the long delay keeps it from popping up while you
// just move across the page.
function startHover(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') {
    return
  }
  clearTimer()
  timer = setTimeout(() => {
    visible.value = true
  }, delay)
}

function endHover(): void {
  clearTimer()
  visible.value = false
}

onBeforeUnmount(clearTimer)
</script>

<template>
  <span class="relative inline-flex" @pointerenter="startHover" @pointerleave="endHover">
    <slot />
    <!-- Visual help only: screen readers get the meaning from the element's own label. -->
    <span
      v-if="visible"
      role="tooltip"
      aria-hidden="true"
      class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-caption whitespace-nowrap text-ink shadow-lg"
      data-test="tooltip"
    >
      {{ text }}
    </span>
  </span>
</template>
