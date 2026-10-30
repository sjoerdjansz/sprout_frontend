<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import IconTile from '@/components/IconTile.vue'
import DetailHeader from '@/components/knowledgeMap/DetailHeader.vue'
import DetailStat from '@/components/knowledgeMap/DetailStat.vue'
import { facetStateClasses } from '@/components/knowledgeMap/facetStateClasses'
import {
  facetState,
  facets,
  holdingCount,
  pluralize,
  subtopicLevel,
  type Level,
} from '@/lib/knowledgeMap'
import { dueLabel } from '@/lib/dueDate'
import { capitalize } from '@/lib/text'
import type { FacetProgress, Subtopic, Topic } from '@/stores/topics'

const { topic, subtopic } = defineProps<{
  topic: Topic
  subtopic: Subtopic
}>()

const emit = defineEmits<{
  edit: []
}>()

const level = computed<Level>(() => subtopicLevel(subtopic))

const nextReview = computed<string>(() => {
  if (subtopic.is_new || subtopic.next_review_on === null) {
    return 'After your first session'
  }

  return capitalize(dueLabel(subtopic.next_review_on))
})

function facetStatus(progress: FacetProgress): string {
  if (progress.holding) {
    return 'Holding over time'
  }

  return progress.percent === null ? 'Not started' : 'Not yet consistent'
}
</script>

<template>
  <DetailHeader
    :overline="topic.title"
    :title="subtopic.title"
    :mastery="subtopic.mastery"
    :mastery-label="`Mastery ${subtopic.mastery}%`"
    :level="level"
    :description="subtopic.description ?? ''"
    @edit="emit('edit')"
  />

  <RouterLink
    :to="{ name: 'subtopic', params: { id: subtopic.id } }"
    class="flex items-center gap-3 rounded-md border border-line bg-canvas px-3.5 py-3 text-ink transition-colors duration-150 ease-default hover:bg-surface-sunken"
    data-test="open-subtopic"
  >
    <IconTile icon="book-open" tint="sky" size="sm" />
    <span class="flex min-w-0 flex-auto flex-col">
      <span class="text-[14px] leading-4.5 font-[650]">Everything about this subtopic</span>
      <span class="text-caption font-normal text-ink-muted">
        Flashcards, questions, sessions and sources
      </span>
    </span>
    <BaseIcon name="chevron-right" :size="18" class="text-ink-subtle" />
  </RouterLink>

  <div class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between">
      <h3 class="text-label text-ink">Mastery by facet</h3>
      <span class="text-caption font-normal text-ink-subtle">
        {{ holdingCount(subtopic) }} of 3 holding
      </span>
    </div>
    <div
      v-for="facet in facets"
      :key="facet.key"
      class="flex items-center gap-3 rounded-md bg-canvas px-3 py-2.5"
      data-test="facet"
    >
      <span
        class="inline-grid size-8 flex-none place-items-center rounded-sm"
        :class="facetStateClasses[facetState(subtopic.facets[facet.key])]"
      >
        <BaseIcon :name="facet.icon" :size="16" />
      </span>
      <span class="flex min-w-0 flex-auto flex-col">
        <span class="text-[14px] leading-4.5 font-[650] text-ink">{{ facet.label }}</span>
        <span
          class="text-caption font-normal"
          :class="subtopic.facets[facet.key].holding ? 'text-sprout-ink' : 'text-ink-subtle'"
        >
          {{ facetStatus(subtopic.facets[facet.key]) }}
        </span>
      </span>
      <span class="font-display text-[17px] font-semibold text-ink">
        {{
          subtopic.facets[facet.key].percent === null
            ? '–'
            : `${subtopic.facets[facet.key].percent}%`
        }}
      </span>
    </div>
    <span class="text-caption font-normal text-ink-subtle">
      Mastered once all three hold over time.
    </span>
  </div>

  <div class="flex gap-2.5">
    <DetailStat
      label="Due today"
      :value="subtopic.due_cards > 0 ? pluralize(subtopic.due_cards, 'card') : 'Nothing'"
      :tone="subtopic.due_cards > 0 ? 'sun' : 'ink'"
    />
    <DetailStat label="Next review" :value="nextReview" />
  </div>
</template>
