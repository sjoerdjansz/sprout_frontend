<script setup lang="ts">
import { computed } from 'vue'
import DetailHeader from '@/components/knowledgeMap/DetailHeader.vue'
import DetailStat from '@/components/knowledgeMap/DetailStat.vue'
import { averageMastery, dueCards, isMastered, topicLevel, type Level } from '@/lib/knowledgeMap'
import type { Topic } from '@/stores/topics'

const { topic, categoryName } = defineProps<{
  topic: Topic
  categoryName: string
}>()

const emit = defineEmits<{
  edit: []
}>()

const mastery = computed<number>(() => averageMastery(topic))
const level = computed<Level>(() => topicLevel(topic))
const due = computed<number>(() => dueCards(topic))
const mastered = computed<number>(() => topic.subtopics.filter(isMastered).length)
</script>

<template>
  <DetailHeader
    :overline="`Main topic · ${categoryName}`"
    :title="topic.title"
    :mastery="mastery"
    :mastery-label="`Average mastery ${mastery}%`"
    :level="level"
    :description="topic.description"
    @edit="emit('edit')"
  />

  <div class="grid grid-cols-3 gap-2.5">
    <DetailStat label="Subtopics" :value="topic.subtopics.length" large />
    <DetailStat label="Mastered" :value="mastered" tone="sprout" large />
    <DetailStat label="Due today" :value="due" :tone="due > 0 ? 'sun' : 'ink'" large />
  </div>
</template>
