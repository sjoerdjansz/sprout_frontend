<script setup lang="ts">
import { computed } from 'vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import { pluralize } from '@/lib/topics'
import { wordCount } from '@/lib/subtopicPage'
import type { SuggestionRow } from '@/composables/topics/useSubtopicSuggestions'

const {
  row,
  error,
  disabled = false,
} = defineProps<{
  row: SuggestionRow
  /** The API's error for this row, e.g. a name the topic already has. */
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  update: [changes: Partial<Pick<SuggestionRow, 'title' | 'keep'>>]
}>()

// Only a subtopic with notes gets cards; say so, so a row without them isn't a surprise.
const material = computed<string>(() =>
  row.notes === null
    ? 'No notes, so no cards'
    : `Cards from ${pluralize(wordCount(row.notes), 'word')} of your source`,
)
</script>

<template>
  <li
    class="flex items-start gap-3 rounded-md border border-line px-3.5 py-3 transition-opacity duration-150"
    :class="row.keep ? 'bg-surface' : 'bg-surface-sunken opacity-60'"
    data-test="suggestion"
  >
    <div class="flex min-w-0 grow flex-col gap-1.5">
      <BaseInput
        :model-value="row.title"
        label="Subtopic name"
        hide-label
        placeholder="Name your subtopic"
        :error="error"
        :disabled="disabled || !row.keep"
        data-test="suggestion-title"
        @update:model-value="emit('update', { title: $event })"
      />
      <p v-if="row.description" class="text-label font-normal text-ink-muted">
        {{ row.description }}
      </p>
      <p class="text-caption font-normal text-ink-subtle" data-test="suggestion-material">
        {{ material }}
      </p>
    </div>
    <BaseSwitch
      :model-value="row.keep"
      :label="`Keep ${row.title || 'this subtopic'}`"
      hide-label
      data-test="suggestion-keep"
      @update:model-value="emit('update', { keep: $event })"
    />
  </li>
</template>
