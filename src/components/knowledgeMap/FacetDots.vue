<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import { facetStateClasses } from '@/components/knowledgeMap/facetStateClasses'
import { facetState, facets, holdingCount } from '@/lib/knowledgeMap'
import type { FacetProgress, Subtopic } from '@/stores/topics'

const { subtopic } = defineProps<{
  subtopic: Subtopic
}>()

const summary = computed<string>(() => `${holdingCount(subtopic)} of 3 facets holding`)

function facetTitle(label: string, progress: FacetProgress): string {
  if (progress.holding) {
    return `${label}: holding over time`
  }

  return progress.percent === null
    ? `${label}: not started`
    : `${label}: ${progress.percent}%, not yet consistent`
}
</script>

<template>
  <span role="img" :aria-label="summary" class="flex gap-1.5">
    <span
      v-for="facet in facets"
      :key="facet.key"
      :title="facetTitle(facet.label, subtopic.facets[facet.key])"
      class="inline-grid size-7 place-items-center rounded-full"
      :class="facetStateClasses[facetState(subtopic.facets[facet.key])]"
    >
      <BaseIcon :name="facet.icon" :size="14" />
    </span>
  </span>
</template>
