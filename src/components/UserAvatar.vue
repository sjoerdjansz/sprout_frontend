<script setup lang="ts">
type Size = 'sm' | 'md'

const { initials, size = 'sm' } = defineProps<{
  initials: string
  /** `sm` (28px) in the sidebar, `md` (32px) next to chat messages. */
  size?: Size
}>()

const sizeClasses: Record<Size, string> = {
  sm: 'size-7 text-caption',
  md: 'size-8 text-label',
}
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-grid flex-none place-items-center rounded-full bg-sun font-bold text-on-sun"
    :class="sizeClasses[size]"
  >
    {{ initials }}
  </span>
</template>
