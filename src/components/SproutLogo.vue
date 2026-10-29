<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'

/** `reversed` is for dark grounds such as the deep-forest art panel. */
const { reversed = false } = defineProps<{
  reversed?: boolean
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
      :class="reversed ? 'text-2xl text-honeydew' : 'text-[22px] text-ink'"
    >
      Sprout
    </span>
  </span>
</template>
