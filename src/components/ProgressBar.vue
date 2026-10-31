<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'sprout' | 'sun' | 'primary' | 'ember'

const {
  value,
  max = 100,
  label,
  valueText,
  tone = 'sprout',
  size = 'md',
} = defineProps<{
  value: number
  max?: number
  /** Always set: it names the bar for screen readers ("Session progress"). */
  label: string
  /** Shown on the right of a visible label ("4 of 10"); without it the bar stands alone. */
  valueText?: string
  /** `sprout` for learning progress, `sun` for goals, `ember` only for slipping cards. */
  tone?: Tone
  size?: 'md' | 'sm'
}>()

const toneClasses: Record<Tone, string> = {
  sprout: 'bg-sprout',
  sun: 'bg-sun',
  primary: 'bg-primary',
  ember: 'bg-ember',
}

const clampedValue = computed<number>(() => Math.min(max, Math.max(0, value)))
const percent = computed<number>(() => (max === 0 ? 0 : (clampedValue.value / max) * 100))
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <div v-if="valueText" class="flex justify-between text-label text-ink">
      <span>{{ label }}</span>
      <span class="text-ink-muted tabular-nums">{{ valueText }}</span>
    </div>
    <div
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="clampedValue"
      class="overflow-hidden rounded-full bg-surface-sunken"
      :class="size === 'sm' ? 'h-1.5' : 'h-2.5'"
    >
      <div
        class="h-full rounded-full transition-[width] duration-700 ease-default"
        :class="toneClasses[tone]"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
