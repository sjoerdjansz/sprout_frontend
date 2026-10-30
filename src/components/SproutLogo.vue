<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'

/**
 * `reversed` is for dark grounds such as the deep-forest art panel; `compact` shows the mark
 * alone (the collapsed sidebar), keeping the name for screen readers.
 */
const { reversed = false, compact = false } = defineProps<{
  reversed?: boolean
  compact?: boolean
}>()
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <span
      class="inline-grid place-items-center rounded-sm"
      :class="
        reversed ? 'size-10 bg-honeydew text-deep-forest' : 'size-9 bg-primary text-on-primary'
      "
    >
      <BaseIcon name="sprout" :size="reversed ? 22 : 18" />
    </span>
    <span
      class="font-display font-semibold tracking-[-0.02em]"
      :class="[
        reversed ? 'text-2xl text-honeydew' : 'text-[22px] text-ink',
        { 'sr-only': compact },
      ]"
    >
      Sprout
    </span>
  </span>
</template>
