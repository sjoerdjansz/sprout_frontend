<script setup lang="ts">
import { computed } from 'vue'

const {
  value,
  size = 88,
  label,
} = defineProps<{
  /** Mastery from 0 to 100; shown in the centre as a percentage. */
  value: number
  size?: number
  /** What the number means, for screen readers ("Photosynthesis mastery 64%"). */
  label: string
}>()

// Proportions from the design system's ProgressRing: the stroke grows with the ring.
const strokeWidth = computed<number>(() => Math.max(6, Math.round(size / 10)))
const radius = computed<number>(() => (size - strokeWidth.value) / 2)
const circumference = computed<number>(() => 2 * Math.PI * radius.value)
const clampedValue = computed<number>(() => Math.min(100, Math.max(0, value)))
const dashOffset = computed<number>(() => circumference.value * (1 - clampedValue.value / 100))
</script>

<template>
  <span
    role="img"
    :aria-label="label"
    class="relative inline-grid flex-none place-items-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="-rotate-90">
      <circle
        class="stroke-surface-sunken"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
      />
      <circle
        class="stroke-sprout transition-[stroke-dashoffset] duration-800 ease-default"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <span
      aria-hidden="true"
      class="absolute inset-0 grid place-items-center font-display font-semibold tracking-[-0.02em] text-ink"
      :style="{ fontSize: `${Math.round(size * 0.24)}px` }"
    >
      {{ clampedValue }}%
    </span>
  </span>
</template>
