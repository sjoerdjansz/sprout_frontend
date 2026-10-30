<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'

const { days, nudge } = defineProps<{
  days: number
  /** One sentence that says what keeps the streak going. */
  nudge: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5 rounded-lg bg-sun-soft p-4">
    <p class="flex items-center gap-1.5 text-label font-bold text-sun-ink">
      <BaseIcon name="flame" :size="16" />
      {{ days }}-day streak
    </p>
    <p class="text-label font-normal text-ink">{{ nudge }}</p>
  </div>
</template>
