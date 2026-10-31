<script setup lang="ts">
type Layout = 'row' | 'stacked'

const {
  pressed,
  disabled = false,
  layout = 'row',
} = defineProps<{
  pressed: boolean
  disabled?: boolean
  /** `row`: content side by side (practice setup); `stacked`: a tile with content on top of each other. */
  layout?: Layout
}>()

const layoutClasses: Record<Layout, string> = {
  row: 'items-center gap-3 px-3.5 py-3',
  stacked: 'flex-col items-start gap-2.5 p-3.5',
}

const emit = defineEmits<{
  toggle: []
}>()
</script>

<!-- A choice you toggle: a bordered card that turns tinted with a primary border when on. -->
<template>
  <button
    type="button"
    class="flex min-h-11 w-full cursor-pointer rounded-md border-[1.5px] text-left text-ink transition-colors duration-150 ease-default focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
    :class="[
      layoutClasses[layout],
      pressed
        ? 'border-primary bg-surface-tint'
        : 'border-line bg-surface hover:border-line-strong',
    ]"
    :aria-pressed="pressed"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    <slot />
  </button>
</template>
