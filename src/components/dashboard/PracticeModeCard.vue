<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'
import IconTile, { type Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'

export interface PracticeMode {
  title: string
  description: string
  icon: IconName
  tint: Tint
}

const { mode } = defineProps<{
  mode: PracticeMode
}>()
</script>

<template>
  <BaseCard interactive class="flex flex-col items-start gap-3">
    <IconTile :icon="mode.icon" :tint="mode.tint" />
    <span class="text-heading text-ink">{{ mode.title }}</span>
    <span class="text-label font-normal text-ink-muted">{{ mode.description }}</span>
  </BaseCard>
</template>
