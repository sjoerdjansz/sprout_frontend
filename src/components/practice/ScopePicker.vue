<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import FilterChip from '@/components/FilterChip.vue'
import IconTile from '@/components/IconTile.vue'
import OptionCard from '@/components/OptionCard.vue'
import { dueCards, pluralize, subtopicCaption, topicAppearance } from '@/lib/topics'
import type { Topic } from '@/stores/topics'

const { topics, showWholeTopicTip } = defineProps<{
  topics: Topic[]
  /** "A whole topic is a lot": when the whole topic is picked for cards or questions. */
  showWholeTopicTip: boolean
}>()

const topicId = defineModel<number>('topicId', { required: true })
/** Null for the whole topic. */
const subtopicId = defineModel<number | null>('subtopicId', { required: true })

const topic = computed<Topic | undefined>(() => topics.find((each) => each.id === topicId.value))

function pickTopic(id: number): void {
  topicId.value = id
  subtopicId.value = null
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-label text-ink">Topic</span>
    <div class="flex flex-wrap gap-2">
      <FilterChip
        v-for="each in topics"
        :key="each.id"
        :pressed="each.id === topicId"
        :icon="topicAppearance(each).icon"
        :data-test="`topic-${each.id}`"
        @click="pickTopic(each.id)"
      >
        {{ each.title }}
      </FilterChip>
    </div>
  </div>

  <div v-if="topic" class="flex flex-col gap-2">
    <span class="text-label text-ink">Subtopic</span>
    <div class="flex flex-col gap-1.5">
      <OptionCard
        :pressed="subtopicId === null"
        :disabled="topic.subtopics.length === 0"
        data-test="scope-whole"
        @toggle="subtopicId = null"
      >
        <IconTile icon="shuffle" tint="peach" size="sm" />
        <span class="flex min-w-0 grow flex-col">
          <b class="text-body-strong">The whole topic · {{ topic.title }}</b>
          <span class="text-caption font-normal text-ink-muted">
            {{ pluralize(topic.subtopics.length, 'subtopic') }} · {{ dueCards(topic) }} due
          </span>
        </span>
      </OptionCard>

      <OptionCard
        v-for="subtopic in topic.subtopics"
        :key="subtopic.id"
        :pressed="subtopicId === subtopic.id"
        :data-test="`scope-${subtopic.id}`"
        @toggle="subtopicId = subtopic.id"
      >
        <span
          class="grid size-8 flex-none place-items-center rounded-sm bg-canvas font-display text-caption font-semibold"
          :class="subtopic.slipping ? 'text-sun-ink' : 'text-sprout-ink'"
        >
          {{ subtopic.mastery }}%
        </span>
        <span class="flex min-w-0 grow flex-col">
          <b class="text-body-strong">{{ subtopic.title }}</b>
          <span class="text-caption font-normal text-ink-muted">
            {{ subtopicCaption(subtopic).text }}
          </span>
        </span>
        <BaseBadge v-if="subtopic.slipping" tone="sun" icon="trending-down">Slipping</BaseBadge>
        <BaseBadge v-else-if="subtopic.due_cards > 0" tone="sun" icon="repeat">
          {{ subtopic.due_cards }} due
        </BaseBadge>
      </OptionCard>

      <p v-if="topic.subtopics.length === 0" class="text-body text-ink-muted">
        This topic has no subtopics yet. You can still talk it through in an open session.
      </p>
    </div>

    <p
      v-if="showWholeTopicTip"
      class="flex items-start gap-2.5 rounded-md bg-sun-soft px-3.5 py-3 text-label font-normal text-ink"
      data-test="whole-topic-tip"
    >
      <BaseIcon name="lightbulb" :size="16" class="mt-0.5 flex-none text-sun-ink" />
      <span>
        <b class="text-sun-ink">A whole topic is a lot.</b> That’s fine for a mixed review, but for
        new or slipping material one subtopic at a time sticks better. Sprout keeps the session to
        the size you pick and puts what’s due first.
      </span>
    </p>
  </div>
</template>
