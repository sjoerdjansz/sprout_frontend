<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'
import IconTile, { type Tint } from '@/components/IconTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import TextLink from '@/components/TextLink.vue'
import SectionStatus from '@/components/insights/SectionStatus.vue'
import { facetPracticeMode, type FacetSummary } from '@/lib/insights'
import { pluralize } from '@/lib/topics'
import type { SectionState } from '@/stores/insights'
import type { FacetKey } from '@/stores/topics'

const { summary, state } = defineProps<{
  /** Null until the library has loaded. */
  summary: FacetSummary | null
  state: SectionState
}>()

const emit = defineEmits<{
  retry: []
}>()

const facetStyles: Record<FacetKey, { tint: Tint; tone: 'sprout' | 'sun' | 'primary' }> = {
  cards: { tint: 'mint', tone: 'sprout' },
  explain: { tint: 'sun', tone: 'sun' },
  quiz: { tint: 'sky', tone: 'primary' },
}

// Two or three words, verbs first, as the design system asks of a call to action.
const practiseLabels: Record<FacetKey, string> = {
  cards: 'Review flashcards',
  explain: 'Explain it back',
  quiz: 'Quiz me',
}
</script>

<template>
  <BaseCard role="region" aria-labelledby="facets-heading" class="flex flex-col gap-4">
    <SectionHeading
      title="Mastery by facet"
      heading-id="facets-heading"
      :subtitle="
        summary && summary.subtopicCount > 0
          ? `How many of your ${pluralize(summary.subtopicCount, 'subtopic')} hold on each facet.`
          : 'How many of your subtopics hold on each facet.'
      "
    />

    <SectionStatus
      :loading="state.loading || summary === null"
      :error="state.error"
      name="facets"
      @retry="emit('retry')"
    >
      <div v-if="summary" class="flex flex-col gap-4">
        <p
          v-if="summary.subtopicCount === 0"
          class="rounded-lg bg-surface-tint p-4 text-label font-normal text-ink-muted"
          data-test="facets-empty"
        >
          Add a subtopic to a topic and practise it to see how each facet holds.
        </p>

        <template v-else>
          <div
            v-for="row in summary.rows"
            :key="row.facet.key"
            class="flex items-center gap-3"
            :data-test="`facet-${row.facet.key}`"
          >
            <IconTile :icon="row.facet.icon" :tint="facetStyles[row.facet.key].tint" size="sm" />
            <ProgressBar
              :value="row.holding"
              :max="summary.subtopicCount"
              :label="row.facet.label"
              :value-text="`${row.holding} of ${summary.subtopicCount} holding`"
              :tone="facetStyles[row.facet.key].tone"
              size="sm"
            />
          </div>

          <div
            v-if="summary.bottleneck"
            class="flex flex-col items-start gap-3 rounded-md bg-sun-soft px-3.5 py-3 text-label font-normal text-ink"
            data-test="facets-bottleneck"
          >
            <p>
              <b class="text-sun-ink">{{ summary.bottleneck.facet.label }} is your bottleneck.</b>
              <template v-if="summary.bottleneck.wouldMaster > 0">
                {{ pluralize(summary.bottleneck.wouldMaster, 'subtopic') }}
                would be mastered if it held there too.
              </template>
            </p>
            <TextLink
              :to="{
                name: 'practice',
                query: { modes: facetPracticeMode[summary.bottleneck.facet.key] },
              }"
              icon-right="arrow-right"
            >
              {{ practiseLabels[summary.bottleneck.facet.key] }}
            </TextLink>
          </div>

          <p
            v-else-if="summary.rows.every((row) => row.holding === 0)"
            class="text-label font-normal text-ink-subtle"
            data-test="facets-none-holding"
          >
            Nothing holds yet. A facet holds once you score 85% or more on two days you practise it.
          </p>
        </template>
      </div>
    </SectionStatus>
  </BaseCard>
</template>
