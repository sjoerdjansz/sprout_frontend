<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import { generatingMessage, pluralize } from '@/lib/topics'
import type { SaveResult } from '@/stores/conversations'

const {
  result = null,
  generatingCount = 0,
  failedCount = 0,
  checkError = null,
} = defineProps<{
  /** What the save you just did added; left out when you open a conversation saved earlier. */
  result?: SaveResult | null
  /** The saved topic's subtopics whose cards Sprout is still making. */
  generatingCount?: number
  /** The ones whose cards couldn't be made; you try again on the subtopic's page. */
  failedCount?: number
  /** Why asking for the status failed; Sprout keeps asking. */
  checkError?: string | null
}>()

// "Saved Biomechanics: 4 new subtopics", or only the name when the save added none.
const summary = computed<string | null>(() => {
  if (result === null) {
    return null
  }
  const added = result.added.subtopics

  return added === 0
    ? `Saved ${result.topic.title}`
    : `Saved ${result.topic.title}: ${pluralize(added, 'new subtopic')}`
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
      <p v-if="generatingCount > 0" class="text-body" data-test="saved-generating">
        {{ generatingMessage }} They show up in your topics in a moment.
      </p>
      <p v-else-if="failedCount > 0" class="text-body" data-test="saved-failed">
        Sprout couldn't make cards for {{ pluralize(failedCount, 'subtopic') }}.
        <RouterLink
          v-if="result !== null"
          :to="{ name: 'topics', query: { topic: result.topic.id } }"
          class="rounded-sm font-semibold underline"
        >
          Open your topics
        </RouterLink>
        to try again.
      </p>
      <p v-else class="text-body">This conversation is saved to your topics.</p>
      <p v-if="checkError" class="text-body" data-test="check-error">
        {{ checkError }} Sprout keeps checking in the meantime.
      </p>
    </div>
  </div>
</template>
