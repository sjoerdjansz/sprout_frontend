<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'

const { overline, title, masteredTopics, totalTopics } = defineProps<{
  overline: string
  title: string
  /** Null until the library has loaded. */
  masteredTopics: number | null
  totalTopics: number
}>()
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="flex flex-col gap-1.5">
      <p class="text-overline text-ink-subtle">{{ overline }}</p>
      <h1 class="font-display text-title-lg text-ink md:text-display">{{ title }}</h1>
    </div>

    <!-- The design's streak badge and notifications bell wait for the API (specs/dashboard.md). -->
    <BaseBadge
      v-if="masteredTopics !== null && totalTopics > 0"
      tone="sprout"
      icon="sprout"
      data-test="mastered-topics"
    >
      {{ masteredTopics }} of {{ totalTopics }} topics mastered
    </BaseBadge>
  </header>
</template>
