<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'

const { feedback } = defineProps<{
  /** What was right, the one missing piece, what next. */
  feedback: string
}>()
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-md bg-sprout-soft px-4 py-3.5 text-body"
    aria-live="polite"
    data-test="explain-feedback"
  >
    <BaseIcon name="sparkles" :size="18" class="mt-0.5 flex-none text-sprout-ink" />
    <div class="flex flex-col gap-0.5 text-ink">
      <b class="text-sprout-ink">Sprout’s feedback</b>
      <span>{{ feedback }}</span>
    </div>
  </div>
</template>
