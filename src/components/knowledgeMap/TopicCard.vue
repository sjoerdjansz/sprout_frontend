<script setup lang="ts">
import { computed } from 'vue'
import IconTile from '@/components/IconTile.vue'
import ProgressRing from '@/components/ProgressRing.vue'
import { averageMastery, dueCards, pluralize } from '@/lib/knowledgeMap'
import type { Topic } from '@/stores/topics'

const { topic, categoryName, selected } = defineProps<{
  topic: Topic
  categoryName: string
  selected: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const mastery = computed<number>(() => averageMastery(topic))
const due = computed<number>(() => dueCards(topic))
</script>

<template>
  <button
    type="button"
    :aria-pressed="selected"
    class="flex w-full cursor-pointer flex-col gap-3.5 rounded-lg border p-4 text-left shadow-sm transition duration-200 ease-default hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
    :class="selected ? 'border-primary bg-surface-tint' : 'border-line bg-surface'"
    @click="emit('select')"
  >
    <span class="flex items-center justify-between gap-3">
      <IconTile :icon="topic.icon" :tint="topic.tint" />
      <ProgressRing :value="mastery" :size="48" :label="`${topic.title} mastery ${mastery}%`" />
    </span>
    <span class="flex flex-col gap-0.75">
      <span class="font-display text-[19px] leading-6 font-semibold tracking-[-0.015em] text-ink">
        {{ topic.title }}
      </span>
      <span class="flex flex-wrap gap-1.5 text-label font-normal text-ink-muted">
        <span> {{ categoryName }} · {{ pluralize(topic.subtopics.length, 'subtopic') }} </span>
        <span v-if="due > 0" class="font-[650] text-sun-ink">· {{ due }} due</span>
      </span>
    </span>
  </button>
</template>
