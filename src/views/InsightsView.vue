<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseTabs from '@/components/BaseTabs.vue'
import ActivityHeatmap from '@/components/insights/ActivityHeatmap.vue'
import FacetMasteryCard from '@/components/insights/FacetMasteryCard.vue'
import InsightsWelcome from '@/components/insights/InsightsWelcome.vue'
import LeavesCard from '@/components/insights/LeavesCard.vue'
import PeriodTiles from '@/components/insights/PeriodTiles.vue'
import TopicTimeCard from '@/components/insights/TopicTimeCard.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { ApiError } from '@/lib/api'
import {
  facetSummary,
  periodTabs,
  topicBubbles,
  type FacetSummary,
  type TopicBubbles,
} from '@/lib/insights'
import {
  useInsightsStore,
  type InsightsPeriod,
  type PeriodInsights,
  type SectionState,
} from '@/stores/insights'
import { useTopicsStore } from '@/stores/topics'

const insightsStore = useInsightsStore()
const topicsStore = useTopicsStore()

// The tabs only change the tiles and the leaves card; the heatmap and the charts cover all time.
const period = ref<InsightsPeriod>('week')
const periodInsights = computed<PeriodInsights | null>(
  () => insightsStore.periods[period.value] ?? null,
)
const periodState = computed<SectionState>(() => insightsStore.periodStates[period.value])

watch(period, (selected) => insightsStore.fetchPeriod(selected))

// --- Your library (`GET /topics`): mastery, subtopics and facets, as on the dashboard

const topicsState = ref<SectionState>({ loading: true, error: null })

async function loadTopics(): Promise<void> {
  topicsState.value = { loading: true, error: null }

  try {
    await topicsStore.fetchTopics()
    topicsState.value = { loading: false, error: null }
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    topicsState.value = { loading: false, error: caught.message }
  }
}

const libraryLoaded = computed<boolean>(
  () => !topicsState.value.loading && topicsState.value.error === null,
)

const facets = computed<FacetSummary | null>(() =>
  libraryLoaded.value ? facetSummary(topicsStore.topics) : null,
)

// The chart needs both the time per topic and the library's mastery.
const bubbles = computed<TopicBubbles | null>(() =>
  libraryLoaded.value && insightsStore.topicInsights !== null
    ? topicBubbles(insightsStore.topicInsights, topicsStore.topics)
    : null,
)
const bubblesState = computed<SectionState>(() => ({
  loading: topicsState.value.loading || insightsStore.topicInsightsState.loading,
  error: insightsStore.topicInsightsState.error ?? topicsState.value.error,
}))

function retryBubbles(): void {
  if (insightsStore.topicInsightsState.error !== null) {
    void insightsStore.fetchTopicInsights()
  }
  if (topicsState.value.error !== null) {
    void loadTopics()
  }
}

// Leaves ever earned is the same in every period: none means you haven't practised yet.
const isNewLearner = computed<boolean>(() => periodInsights.value?.leaves.total === 0)

onMounted(() => {
  insightsStore.forgetPeriods()
  void insightsStore.fetchPeriod(period.value)
  void insightsStore.fetchActivity()
  void insightsStore.fetchTopicInsights()
  void loadTopics()
})
</script>

<template>
  <AppLayout>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-display text-title-lg text-ink md:text-display">Insights</h1>
      </div>
      <BaseTabs v-model="period" :items="periodTabs" label="Period" />
    </header>

    <InsightsWelcome v-if="isNewLearner" :has-topics="topicsStore.topics.length > 0" />

    <PeriodTiles
      :insights="periodInsights"
      :state="periodState"
      :topics="topicsStore.topics"
      :topics-state="topicsState"
      @retry="insightsStore.fetchPeriod(period)"
      @retry-topics="loadTopics"
    />

    <LeavesCard
      :leaves="periodInsights?.leaves ?? null"
      :period="period"
      :state="periodState"
      @retry="insightsStore.fetchPeriod(period)"
    />

    <ActivityHeatmap
      :activity="insightsStore.activity"
      :state="insightsStore.activityState"
      @retry="insightsStore.fetchActivity"
    />

    <TopicTimeCard :bubbles="bubbles" :state="bubblesState" @retry="retryBubbles" />

    <FacetMasteryCard :summary="facets" :state="topicsState" @retry="loadTopics" />
  </AppLayout>
</template>
