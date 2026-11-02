<script setup lang="ts">
import type { LibraryStat } from '@/lib/topics'

const { stats } = defineProps<{
  stats: LibraryStat[]
}>()
</script>

<template>
  <!-- Space does the separating; due cards stand out in the due colour, as elsewhere. The label
       comes first for screen readers ("topics, 2") and second on screen ("2 topics"). -->
  <dl class="flex flex-wrap gap-x-5 gap-y-1 text-label" data-test="summary">
    <div v-for="stat in stats" :key="stat.key" class="flex items-baseline gap-1">
      <dt class="order-2 font-normal text-ink-muted">{{ stat.label }}</dt>
      <dd
        class="order-1 font-display text-[15px] font-semibold"
        :class="stat.key === 'due' && stat.value > 0 ? 'text-sun-ink' : 'text-ink'"
      >
        {{ stat.value }}
      </dd>
    </div>
  </dl>
</template>
