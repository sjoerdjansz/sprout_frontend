<script setup lang="ts">
import { computed } from 'vue'
import StatTile from '@/components/StatTile.vue'
import SectionStatus from '@/components/insights/SectionStatus.vue'
import { masteredTile, recallTile, streakTile, studyTimeTile, type TileText } from '@/lib/insights'
import type { PeriodInsights, SectionState } from '@/stores/insights'
import type { Topic } from '@/stores/topics'

const { insights, state, topics, topicsState } = defineProps<{
  /** The selected period's numbers; null until they've loaded. */
  insights: PeriodInsights | null
  state: SectionState
  /** Topics mastered comes from the library, so it loads and fails apart from the period. */
  topics: Topic[]
  topicsState: SectionState
}>()

const emit = defineEmits<{
  retry: []
  retryTopics: []
}>()

interface Tile extends TileText {
  key: string
  label: string
  icon: 'flame' | 'target' | 'clock'
  tint: 'sun' | 'sky' | 'mint'
}

const periodTiles = computed<Tile[]>(() => {
  if (insights === null) {
    return []
  }

  return [
    { key: 'streak', label: 'Streak', icon: 'flame', tint: 'sun', ...streakTile(insights) },
    { key: 'recall', label: 'Recall rate', icon: 'target', tint: 'sky', ...recallTile(insights) },
    {
      key: 'study-time',
      label: 'Study time',
      icon: 'clock',
      tint: 'mint',
      ...studyTimeTile(insights),
    },
  ]
})

const mastered = computed<TileText>(() => masteredTile(topics))

const tileSkeleton = 'h-34 rounded-lg bg-surface-sunken motion-safe:animate-pulse'
</script>

<template>
  <!-- Each tile is a cell of the grid, so the row wraps the same way while loading. -->
  <section aria-label="Your numbers" class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
    <SectionStatus
      v-if="state.error !== null"
      :loading="false"
      :error="state.error"
      name="period"
      class="sm:col-span-2 xl:col-span-3"
      @retry="emit('retry')"
    />
    <template v-else-if="insights === null || state.loading">
      <div
        v-for="index in 3"
        :key="index"
        :class="tileSkeleton"
        aria-hidden="true"
        data-test="period-loading"
      />
    </template>
    <StatTile
      v-for="tile in periodTiles"
      v-else
      :key="tile.key"
      :label="tile.label"
      :value="tile.value"
      :unit="tile.unit"
      :hint="tile.hint"
      :icon="tile.icon"
      :tint="tile.tint"
      :data-test="`tile-${tile.key}`"
    />

    <SectionStatus
      :loading="topicsState.loading"
      :error="topicsState.error"
      name="mastered"
      @retry="emit('retryTopics')"
    >
      <template #skeleton>
        <div :class="tileSkeleton" aria-hidden="true" />
      </template>

      <StatTile
        label="Topics mastered"
        :value="mastered.value"
        :unit="mastered.unit"
        :hint="mastered.hint"
        icon="trophy"
        tint="peach"
        class="h-full"
        data-test="tile-mastered"
      />
    </SectionStatus>
  </section>
</template>
