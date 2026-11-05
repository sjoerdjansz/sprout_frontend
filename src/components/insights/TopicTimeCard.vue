<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import IconTile from '@/components/IconTile.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import TextLink from '@/components/TextLink.vue'
import SectionStatus from '@/components/insights/SectionStatus.vue'
import TopicBubbleChart from '@/components/insights/TopicBubbleChart.vue'
import FacetDots from '@/components/topics/FacetDots.vue'
import { formatStudyTime, type TopicBubble, type TopicBubbles } from '@/lib/insights'
import { pluralize, topicAppearance } from '@/lib/topics'
import type { SectionState } from '@/stores/insights'

const { bubbles, state } = defineProps<{
  /** Null until both the topics' time and the library have loaded. */
  bubbles: TopicBubbles | null
  state: SectionState
}>()

const emit = defineEmits<{
  retry: []
}>()

// The topic whose subtopics show next to the chart: the one you pick, or else the most studied.
const pickedId = ref<number | null>(null)
const selected = computed<TopicBubble | null>(() => {
  const plotted = bubbles?.plotted ?? []
  const picked = plotted.find((bubble) => bubble.id === pickedId.value)
  if (picked) {
    return picked
  }

  return plotted.reduce<TopicBubble | null>(
    (most, bubble) => (most === null || bubble.minutes > most.minutes ? bubble : most),
    null,
  )
})
</script>

<template>
  <BaseCard role="region" aria-labelledby="topics-heading" class="flex flex-col gap-4">
    <SectionHeading title="Where your time goes" heading-id="topics-heading" />

    <SectionStatus
      :loading="state.loading || bubbles === null"
      :error="state.error"
      name="topics"
      @retry="emit('retry')"
    >
      <div v-if="bubbles" class="flex flex-col gap-4">
        <div
          v-if="bubbles.plotted.length === 0"
          class="flex flex-col items-start gap-2 rounded-lg bg-surface-tint p-4"
          data-test="topics-empty"
        >
          <p class="text-heading text-ink">
            {{ bubbles.notStarted.length === 0 ? 'No topics yet' : 'Nothing to plot yet' }}
          </p>
          <p class="text-label font-normal text-ink-muted">
            {{
              bubbles.notStarted.length === 0
                ? 'Ask the tutor about something new and save it, or add a topic yourself.'
                : 'Practise a topic and it shows up here, with the time it took and what it bought.'
            }}
          </p>
          <TextLink
            :to="bubbles.notStarted.length === 0 ? { name: 'topics' } : { name: 'practice' }"
            icon-right="arrow-right"
          >
            {{ bubbles.notStarted.length === 0 ? 'Open your topics' : 'Start practising' }}
          </TextLink>
        </div>

        <div v-else class="flex flex-wrap items-start gap-6">
          <TopicBubbleChart
            :bubbles="bubbles.plotted"
            :selected-id="selected?.id ?? null"
            class="min-w-0 flex-[999_1_480px]"
            @select="pickedId = $event"
          />

          <aside
            v-if="selected"
            class="flex min-w-0 flex-[1_1_260px] flex-col gap-3 rounded-lg bg-canvas p-4 lg:max-w-85"
            aria-live="polite"
            data-test="topic-detail"
          >
            <div class="flex items-center gap-3">
              <IconTile v-bind="topicAppearance(selected.topic)" size="md" />
              <div class="flex min-w-0 flex-col">
                <h3 class="text-heading text-ink">{{ selected.title }}</h3>
                <p class="text-label font-normal text-ink-subtle">
                  {{ formatStudyTime(selected.minutes) }} · {{ selected.mastery }}% ·
                  {{ pluralize(selected.cardCount, 'card') }}
                </p>
              </div>
            </div>

            <ul class="flex flex-col gap-2">
              <li
                v-for="subtopic in selected.topic.subtopics"
                :key="subtopic.id"
                class="flex items-center gap-2.5 text-label font-normal text-ink"
              >
                <span class="min-w-0 flex-1 truncate">{{ subtopic.title }}</span>
                <FacetDots :subtopic="subtopic" />
                <b class="w-10 text-right font-display tabular-nums">{{ subtopic.mastery }}%</b>
              </li>
            </ul>

            <TextLink :to="{ name: 'topic', params: { id: selected.id } }" icon-right="arrow-right">
              Open topic
            </TextLink>
          </aside>
        </div>

        <!-- They'd all sit on top of each other at 0, 0, so they're named here instead. -->
        <p
          v-if="bubbles.plotted.length > 0 && bubbles.notStarted.length > 0"
          class="text-label font-normal text-ink-muted"
          data-test="topics-not-started"
        >
          Not practised yet:
          <template v-for="(bubble, index) in bubbles.notStarted" :key="bubble.id">
            <RouterLink
              :to="{ name: 'topic', params: { id: bubble.id } }"
              class="font-[650] text-primary hover:text-primary-hover"
            >
              {{ bubble.title }}</RouterLink
            >{{ index < bubbles.notStarted.length - 1 ? ', ' : '' }}
          </template>
        </p>
      </div>
    </SectionStatus>
  </BaseCard>
</template>
