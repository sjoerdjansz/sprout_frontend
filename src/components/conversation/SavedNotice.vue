<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { SaveResult } from '@/stores/conversations'

const { result = null } = defineProps<{
  /** What the save you just did added; left out when you open a conversation saved earlier. */
  result?: SaveResult | null
}>()

function count(amount: number, singular: string, plural: string): string {
  return `${amount} ${amount === 1 ? singular : plural}`
}

// "Saved Biomechanics: 2 subtopics, 18 flashcards and 7 questions"
const summary = computed<string | null>(() => {
  if (result === null) {
    return null
  }

  const { subtopics, flashcards, questions } = result.added

  return (
    `Saved ${result.topic.title}: ${count(subtopics, 'subtopic', 'subtopics')}, ` +
    `${count(flashcards, 'flashcard', 'flashcards')} and ${count(questions, 'question', 'questions')}`
  )
})
</script>

<template>
  <div
    role="status"
    class="flex items-start gap-3 rounded-lg bg-sprout-soft px-5 py-4 text-sprout-ink"
    data-test="saved-notice"
  >
    <BaseIcon name="check" class="mt-0.5" />
    <div class="flex flex-col gap-0.5">
      <p v-if="summary" class="text-body-strong">{{ summary }}</p>
      <p class="text-body">This conversation is saved to your knowledge map.</p>
    </div>
  </div>
</template>
