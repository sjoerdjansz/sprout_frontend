<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

/** The four topic tints (`*-soft` ground, `*-ink` icon) and a neutral gray. */
export type Tint = 'mint' | 'sun' | 'peach' | 'sky' | 'gray'

type Size = 'sm' | 'md' | 'lg'

const {
  icon,
  tint = 'mint',
  size = 'lg',
} = defineProps<{
  icon: IconName
  tint?: Tint
  size?: Size
}>()

const tintClasses: Record<Tint, string> = {
  mint: 'bg-sprout-soft text-sprout-ink',
  sun: 'bg-sun-soft text-sun-ink',
  peach: 'bg-ember-soft text-ember-ink',
  sky: 'bg-sky-soft text-sky-ink',
  gray: 'bg-surface-sunken text-ink-muted',
}

const sizeClasses: Record<Size, string> = {
  sm: 'size-8 rounded-sm',
  md: 'size-9 rounded-sm',
  lg: 'size-11 rounded-md',
}

const iconSizes: Record<Size, number> = {
  sm: 16,
  md: 18,
  lg: 22,
}
</script>

<template>
  <span
    class="inline-grid flex-none place-items-center"
    :class="[tintClasses[tint], sizeClasses[size]]"
  >
    <BaseIcon :name="icon" :size="iconSizes[size]" />
  </span>
</template>
