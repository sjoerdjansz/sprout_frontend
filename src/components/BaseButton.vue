<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const {
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon,
  iconRight,
  block = false,
} = defineProps<{
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit'
  icon?: IconName
  iconRight?: IconName
  block?: boolean
}>()

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-xs hover:bg-primary-hover',
  secondary: 'border-line-strong bg-surface text-ink shadow-xs hover:bg-surface-sunken',
  // For toolbars and inside cards: no ground or shadow until you hover.
  ghost: 'bg-transparent text-ink hover:bg-surface-sunken',
  // Only for destructive acts, and always behind a confirm.
  danger: 'bg-ember text-on-ember shadow-xs hover:bg-ember-ink',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8.5 rounded-sm px-3 text-label',
  md: 'h-11 rounded-md px-5 text-body-strong',
  lg: 'h-13 rounded-lg px-6 text-base font-semibold',
}

const iconSizes: Record<Size, number> = {
  sm: 16,
  md: 18,
  lg: 20,
}

const iconSize = computed<number>(() => iconSizes[size])
</script>

<template>
  <button
    :type="type"
    class="inline-flex cursor-pointer items-center justify-center gap-2 border border-transparent whitespace-nowrap transition duration-150 ease-default active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0"
    :class="[variantClasses[variant], sizeClasses[size], { 'flex w-full': block }]"
  >
    <BaseIcon v-if="icon" :name="icon" :size="iconSize" />
    <slot />
    <BaseIcon v-if="iconRight" :name="iconRight" :size="iconSize" />
  </button>
</template>
