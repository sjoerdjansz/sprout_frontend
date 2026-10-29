<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

type Variant = 'primary' | 'secondary'
type Size = 'md' | 'lg'

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
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border-line-strong bg-surface text-ink hover:bg-surface-sunken',
}

const sizeClasses: Record<Size, string> = {
  md: 'h-11 rounded-md px-5 text-body-strong',
  lg: 'h-13 rounded-lg px-6 text-base font-semibold',
}

const iconSize = computed<number>(() => (size === 'lg' ? 20 : 18))
</script>

<template>
  <button
    :type="type"
    class="inline-flex cursor-pointer items-center justify-center gap-2 border border-transparent whitespace-nowrap shadow-xs transition duration-150 ease-default active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0"
    :class="[variantClasses[variant], sizeClasses[size], { 'flex w-full': block }]"
  >
    <BaseIcon v-if="icon" :name="icon" :size="iconSize" />
    <slot />
    <BaseIcon v-if="iconRight" :name="iconRight" :size="iconSize" />
  </button>
</template>
