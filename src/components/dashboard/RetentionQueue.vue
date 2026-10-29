<script setup lang="ts">
import { ref } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import RetentionQueueItem, { type QueueTopic } from '@/components/dashboard/RetentionQueueItem.vue'

const { topics, dueCount, minutes } = defineProps<{
  topics: QueueTopic[]
  dueCount: number
  /** Rough length of the review session. */
  minutes: number
}>()

const interleaving = ref(true)
</script>

<template>
  <BaseCard role="region" aria-labelledby="queue-heading" class="flex flex-col gap-4">
    <SectionHeading
      title="Today’s retention queue"
      heading-id="queue-heading"
      subtitle="Picked by your forgetting curve"
    >
      <BaseBadge tone="sun" icon="repeat">{{ dueCount }} due</BaseBadge>
    </SectionHeading>

    <ul class="flex flex-col">
      <RetentionQueueItem v-for="topic in topics" :key="topic.topic" :item="topic" />
    </ul>

    <BaseSwitch v-model="interleaving" label="Mix topics in one session (interleaving)" />

    <div class="grow" />

    <BaseButton size="lg" block icon-right="arrow-right">
      Start review · about {{ minutes }} min
    </BaseButton>
  </BaseCard>
</template>
