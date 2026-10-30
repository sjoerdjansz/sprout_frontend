<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import ProgressRing from '@/components/ProgressRing.vue'
import type { Level } from '@/lib/knowledgeMap'

const { overline, title, mastery, masteryLabel, level, description } = defineProps<{
  overline: string
  title: string
  mastery: number
  masteryLabel: string
  level: Level
  description: string
}>()

const emit = defineEmits<{
  edit: []
}>()
</script>

<template>
  <div class="flex items-start gap-3.5">
    <ProgressRing :value="mastery" :size="76" :label="masteryLabel" />
    <div class="flex min-w-0 flex-auto flex-col gap-1.5">
      <span class="text-overline text-ink-subtle uppercase">{{ overline }}</span>
      <h2
        class="font-display text-2xl leading-7 font-semibold tracking-[-0.02em] text-ink"
        data-test="detail-title"
      >
        {{ title }}
      </h2>
      <div class="flex">
        <BaseBadge :tone="level.tone" :icon="level.icon" data-test="level">
          {{ level.label }}
        </BaseBadge>
      </div>
    </div>
    <BaseIconButton icon="pencil" label="Edit" size="sm" data-test="edit" @click="emit('edit')" />
  </div>
  <p class="text-[14px] leading-5.25 text-ink-muted">{{ description || 'No description yet.' }}</p>
</template>
