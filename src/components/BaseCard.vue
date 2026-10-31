<script setup lang="ts">
type Padding = 'sm' | 'md'

const {
  padding = 'md',
  interactive = false,
  tint = false,
} = defineProps<{
  padding?: Padding
  /** Renders a button that lifts on hover; listen for `click` on the card. */
  interactive?: boolean
  /** A `surface-tint` panel without border or shadow, for asides. */
  tint?: boolean
}>()

const paddingClasses: Record<Padding, string> = {
  sm: 'p-4',
  // Cards pad space-4 at phone width (design system, "Spacing & layout").
  md: 'p-4 md:p-6',
}
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    class="rounded-lg border text-ink"
    :class="[
      paddingClasses[padding],
      tint ? 'border-transparent bg-surface-tint' : 'border-line bg-surface shadow-sm',
      {
        'w-full cursor-pointer text-left transition duration-200 ease-default hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0':
          interactive,
      },
    ]"
  >
    <slot />
  </component>
</template>
