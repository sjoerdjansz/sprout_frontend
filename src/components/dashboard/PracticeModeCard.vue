<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'
import IconTile from '@/components/IconTile.vue'
import type { PracticeMode } from '@/lib/practiceModes'

const { mode } = defineProps<{
  mode: PracticeMode
}>()
</script>

<template>
  <BaseCard interactive class="flex flex-col items-start gap-3">
    <IconTile :icon="mode.icon" :tint="mode.tint" />
    <span class="text-heading text-ink">{{ mode.name }}</span>
    <span class="text-label font-normal text-ink-muted">{{ mode.blurb }}</span>
  </BaseCard>
</template>
