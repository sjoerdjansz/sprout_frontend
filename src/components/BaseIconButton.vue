<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

type Variant = 'ghost' | 'secondary' | 'primary'
type Size = 'sm' | 'md'

const {
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  type = 'button',
} = defineProps<{
  icon: IconName
  /** Required: the button has no visible text, so this is what screen readers announce. */
  label: string
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit'
}>()

const variantClasses: Record<Variant, string> = {
  ghost: 'border-transparent bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink',
  secondary: 'border-line-strong bg-surface text-ink shadow-xs hover:bg-surface-sunken',
  primary: 'border-transparent bg-primary text-on-primary shadow-xs hover:bg-primary-hover',
}

const sizeClasses: Record<Size, string> = {
  sm: 'size-8 rounded-sm',
  md: 'size-10 rounded-md',
}
</script>

<template>
  <button
    :type="type"
    :aria-label="label"
    :title="label"
    class="inline-grid flex-none cursor-pointer place-items-center border transition-colors duration-150 ease-default disabled:cursor-not-allowed disabled:opacity-45"
    :class="[variantClasses[variant], sizeClasses[size]]"
  >
    <BaseIcon :name="icon" :size="size === 'sm' ? 16 : 20" />
  </button>
</template>
