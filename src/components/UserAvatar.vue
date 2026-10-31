<script setup lang="ts">
import type { AvatarColor } from '@/stores/auth'

type Size = 'sm' | 'md' | 'lg'

const {
  initials,
  color = 'sun',
  size = 'sm',
} = defineProps<{
  initials: string
  /** Your pick in settings: one of the four topic-tile tints. */
  color?: AvatarColor
  /** `sm` (28px) in the sidebar, `md` (32px) next to chat messages, `lg` (64px) in settings. */
  size?: Size
}>()

const colorClasses: Record<AvatarColor, string> = {
  sun: 'bg-sun-soft text-sun-ink',
  mint: 'bg-sprout-soft text-sprout-ink',
  peach: 'bg-ember-soft text-ember-ink',
  sky: 'bg-sky-soft text-sky-ink',
}

const sizeClasses: Record<Size, string> = {
  sm: 'size-7 text-caption font-bold',
  md: 'size-8 text-label font-bold',
  lg: 'size-16 font-display text-title font-semibold',
}
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-grid flex-none place-items-center rounded-full"
    :class="[colorClasses[color], sizeClasses[size]]"
  >
    {{ initials }}
  </span>
</template>
