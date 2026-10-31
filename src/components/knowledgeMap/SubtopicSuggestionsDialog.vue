<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import FormError from '@/components/FormError.vue'
import SuggestionRow from '@/components/knowledgeMap/SuggestionRow.vue'
import type {
  SuggestionRow as Row,
  SuggestionsPhase,
} from '@/composables/knowledgeMap/useSubtopicSuggestions'
import type { ApiError } from '@/lib/api'
import { pluralize } from '@/lib/knowledgeMap'

const { topicTitle, phase, rows, error, rowErrors, keptCount, canAdd } = defineProps<{
  topicTitle: string
  phase: SuggestionsPhase
  rows: Row[]
  error: ApiError | null
  rowErrors: Record<number, string>
  keptCount: number
  canAdd: boolean
}>()

const emit = defineEmits<{
  updateRow: [key: number, changes: Partial<Pick<Row, 'title' | 'keep'>>]
  addOwn: []
  add: []
  retry: []
  skip: []
}>()

// Row errors show under their row; the rest (the list, the topic, a busy or unavailable AI)
// above the buttons.
const generalError = computed<string | null>(() => {
  if (error === null) {
    return null
  }
  // Exact keys: fieldError('subtopics') would also match a row's 'subtopics.1.title'.
  const listError = error.errors.topic?.[0] ?? error.errors.subtopics?.[0]
  if (listError) {
    return listError
  }

  return Object.keys(rowErrors).length > 0 ? null : error.message
})

// Waiting a moment or asking again can help; a refused list needs you to change it.
const canRetry = computed<boolean>(
  () => error !== null && (error.status === 429 || error.status >= 500 || error.status === 0),
)
</script>

<template>
  <BaseDialog
    title="Sprout suggests these subtopics"
    size="lg"
    :closable="phase !== 'adding'"
    @close="emit('skip')"
  >
    <div class="flex flex-col gap-5" data-test="suggestions">
      <template v-if="phase === 'reading'">
        <div
          v-if="error === null"
          class="flex flex-col gap-1 rounded-md bg-surface-tint px-4 py-3.5"
          aria-live="polite"
          data-test="suggestions-reading"
        >
          <b class="text-body-strong text-sprout-ink">Sprout is reading your source…</b>
          <span class="text-label font-normal text-ink-muted">
            This can take a minute for a long source. {{ topicTitle }} is already saved.
          </span>
        </div>
      </template>

      <template v-else>
        <p class="text-body text-ink-muted">
          Check how Sprout split {{ topicTitle }}. Rename, leave out or add a subtopic; the ones
          with notes get flashcards and questions.
        </p>
        <ul class="flex flex-col gap-2.5">
          <SuggestionRow
            v-for="row in rows"
            :key="row.key"
            :row="row"
            :error="rowErrors[row.key]"
            :disabled="phase === 'adding'"
            @update="emit('updateRow', row.key, $event)"
          />
        </ul>
        <div>
          <BaseButton
            variant="ghost"
            size="sm"
            icon="plus"
            :disabled="phase === 'adding'"
            data-test="add-own"
            @click="emit('addOwn')"
          >
            Add a subtopic
          </BaseButton>
        </div>
      </template>

      <div v-if="generalError" class="flex flex-wrap items-center gap-3">
        <FormError :message="generalError" />
        <BaseButton
          v-if="canRetry"
          variant="secondary"
          size="sm"
          icon="rotate-ccw"
          data-test="suggestions-retry"
          @click="emit('retry')"
        >
          Try again
        </BaseButton>
      </div>

      <div class="flex justify-end gap-2">
        <BaseButton
          variant="ghost"
          :disabled="phase === 'adding'"
          data-test="suggestions-skip"
          @click="emit('skip')"
        >
          Skip
        </BaseButton>
        <BaseButton
          v-if="phase !== 'reading'"
          icon="check"
          :disabled="!canAdd"
          data-test="suggestions-add"
          @click="emit('add')"
        >
          <template v-if="phase === 'adding'">Adding…</template>
          <template v-else>Add {{ pluralize(keptCount, 'subtopic') }}</template>
        </BaseButton>
      </div>
    </div>
  </BaseDialog>
</template>
