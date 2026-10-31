<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'

const { overline, title, streakDays, masteredTopics, totalTopics } = defineProps<{
  overline: string
  title: string
  streakDays: number
  masteredTopics: number
  totalTopics: number
}>()
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="flex flex-col gap-1.5">
      <p class="text-overline text-ink-subtle">{{ overline }}</p>
      <h1 class="font-display text-title-lg text-ink md:text-display">{{ title }}</h1>
    </div>

    <div class="flex items-center gap-2">
      <BaseBadge tone="sun" icon="flame">{{ streakDays }}-day streak</BaseBadge>
      <BaseBadge tone="sprout" icon="sprout">
        {{ masteredTopics }} of {{ totalTopics }} topics mastered
      </BaseBadge>
      <BaseIconButton icon="bell" label="Notifications" variant="secondary" />
    </div>
  </header>
</template>
