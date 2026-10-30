<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import IconTile from '@/components/IconTile.vue'
import type { PracticeMode } from '@/lib/practiceModes'

const { mode, selected, suggested } = defineProps<{
  mode: PracticeMode
  selected: boolean
  suggested: boolean
}>()

const emit = defineEmits<{
  pick: []
}>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="selected"
    class="flex w-full cursor-pointer items-center gap-3 rounded-md border-[1.5px] px-3 py-2 text-left transition-colors duration-150 ease-default"
    :class="selected ? 'border-primary bg-surface-tint' : 'border-line bg-surface hover:bg-canvas'"
    @click="emit('pick')"
  >
    <IconTile :icon="mode.icon" :tint="mode.tint" size="sm" />
    <span class="flex min-w-0 flex-auto flex-col">
      <span class="text-[14px] leading-4.5 font-[650] text-ink">{{ mode.name }}</span>
      <span class="text-caption font-normal text-ink-muted">{{ mode.blurb }}</span>
    </span>
    <BaseBadge v-if="suggested" tone="sun" icon="sparkles">Suggested</BaseBadge>
  </button>
</template>
