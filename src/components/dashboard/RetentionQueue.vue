<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import FormError from '@/components/FormError.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import TextLink from '@/components/TextLink.vue'
import RetentionQueueItem from '@/components/dashboard/RetentionQueueItem.vue'
import type { QueueTopic } from '@/lib/dashboard'

export type QueueState = 'loading' | 'loaded' | 'failed'

const {
  state,
  error = '',
  topics,
  dueCount,
  minutes,
  libraryIsEmpty,
} = defineProps<{
  state: QueueState
  /** Why loading failed, from the API. */
  error?: string
  /** The rows to show, most urgent first. */
  topics: QueueTopic[]
  /** Every card due today, in the whole library. */
  dueCount: number
  /** Rough length of reviewing the first topic; 0 leaves it out of the button. */
  minutes: number
  libraryIsEmpty: boolean
}>()

const emit = defineEmits<{
  start: []
  retry: []
}>()
</script>

<template>
  <BaseCard role="region" aria-labelledby="queue-heading" class="flex flex-col gap-4">
    <SectionHeading
      title="Today’s retention queue"
      heading-id="queue-heading"
      subtitle="Picked by your forgetting curve"
    >
      <BaseBadge v-if="state === 'loaded' && dueCount > 0" tone="sun" icon="repeat">
        {{ dueCount }} due
      </BaseBadge>
    </SectionHeading>

    <p v-if="state === 'loading'" class="text-ink-muted" aria-live="polite">Loading your queue…</p>

    <div v-else-if="state === 'failed'" class="flex flex-col items-start gap-4">
      <FormError :message="error" />
      <BaseButton
        variant="secondary"
        icon="rotate-ccw"
        data-test="queue-retry"
        @click="emit('retry')"
      >
        Try again
      </BaseButton>
    </div>

    <div
      v-else-if="libraryIsEmpty"
      class="flex flex-col items-start gap-2 rounded-lg bg-surface-tint p-4"
      data-test="queue-empty-library"
    >
      <p class="text-heading text-ink">Nothing to review yet</p>
      <p class="text-label font-normal text-ink-muted">
        Ask the tutor about something new and save it, or add a topic yourself.
      </p>
      <TextLink :to="{ name: 'topics' }" icon-right="arrow-right"> Open your topics </TextLink>
    </div>

    <div
      v-else-if="topics.length === 0"
      class="flex flex-col items-start gap-2 rounded-lg bg-surface-tint p-4"
      data-test="queue-done"
    >
      <p class="text-heading text-ink">Nothing due today</p>
      <p class="text-label font-normal text-ink-muted">
        That’s everything due today. See you tomorrow!
      </p>
    </div>

    <template v-else>
      <ul class="flex flex-col">
        <RetentionQueueItem v-for="topic in topics" :key="topic.topicId" :item="topic" />
      </ul>

      <div class="grow" />

      <BaseButton
        size="lg"
        block
        icon-right="arrow-right"
        data-test="start-review"
        @click="emit('start')"
      >
        Start review<template v-if="minutes > 0"> · about {{ minutes }} min</template>
      </BaseButton>
    </template>
  </BaseCard>
</template>
