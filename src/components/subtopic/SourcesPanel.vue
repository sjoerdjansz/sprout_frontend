<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import MaterialRow from '@/components/subtopic/MaterialRow.vue'
import MaterialToolbar from '@/components/subtopic/MaterialToolbar.vue'
import { pluralize } from '@/lib/knowledgeMap'
import { wordCount } from '@/lib/subtopicPage'

const { notes, generatedCards, generatedQuestions, generating } = defineProps<{
  /** For now a subtopic's only source: the notes its cards and questions are made from. */
  notes: string | null
  /** How many cards and questions Sprout made (not the ones you wrote yourself). */
  generatedCards: number
  generatedQuestions: number
  generating: boolean
}>()

const emit = defineEmits<{
  /** Adding and editing both go through the subtopic's notes, in the subtopic form. */
  edit: []
  generate: []
  remove: []
}>()

const query = ref('')
const expanded = ref(false)
const notesId = useId()

const sourceName = 'Your notes'

const shownNotes = computed<string | null>(() => {
  const search = query.value.trim().toLowerCase()
  if (notes === null || search === '') {
    return notes
  }

  return sourceName.toLowerCase().includes(search) || notes.toLowerCase().includes(search)
    ? notes
    : null
})
</script>

<template>
  <!-- No filter chips: there's one kind of source for now. -->
  <MaterialToolbar v-model:query="query" search-label="Search sources">
    <BaseButton
      v-if="notes === null"
      size="sm"
      icon="upload"
      data-test="add-source"
      @click="emit('edit')"
    >
      Add source
    </BaseButton>
  </MaterialToolbar>

  <ul class="flex flex-col gap-0.5 p-2">
    <MaterialRow
      v-if="shownNotes !== null"
      icon="pencil"
      tint="sun"
      :highlighted="expanded"
      data-test="source"
    >
      <button
        type="button"
        :aria-expanded="expanded"
        :aria-controls="notesId"
        class="flex cursor-pointer flex-col gap-0.5 rounded-sm text-left"
        @click="expanded = !expanded"
      >
        <b class="text-[15px] leading-5 font-[650] text-ink">{{ sourceName }}</b>
        <span class="text-label font-normal text-ink-muted">
          Notes · {{ pluralize(wordCount(shownNotes), 'word') }}
        </span>
      </button>
      <p
        v-if="expanded"
        :id="notesId"
        class="mt-2.5 max-w-180 rounded-sm bg-surface px-3 py-2.5 text-[14px] leading-5 whitespace-pre-wrap text-ink"
        data-test="notes-text"
      >
        {{ shownNotes }}
      </p>

      <template #meta>
        <span class="text-label text-ink">
          {{ pluralize(generatedCards, 'card') }} · {{ pluralize(generatedQuestions, 'question') }}
        </span>
        <span class="text-caption font-normal text-ink-subtle">made by Sprout</span>
      </template>

      <template #actions>
        <BaseIconButton
          icon="eye"
          :label="expanded ? 'Hide notes' : 'Show notes'"
          size="sm"
          @click="expanded = !expanded"
        />
        <BaseIconButton
          icon="sparkles"
          :label="generating ? 'Generating…' : 'Generate more cards from this'"
          size="sm"
          :disabled="generating"
          data-test="generate-from-source"
          @click="emit('generate')"
        />
        <BaseIconButton
          icon="pencil"
          label="Edit notes"
          size="sm"
          data-test="edit-source"
          @click="emit('edit')"
        />
        <BaseIconButton
          icon="trash-2"
          label="Remove source"
          size="sm"
          data-test="remove-source"
          @click="emit('remove')"
        />
      </template>
    </MaterialRow>

    <li v-else class="px-4 py-8 text-center text-[14px] text-ink-muted" data-test="empty">
      {{
        notes === null
          ? 'No sources yet. Add your notes and Sprout turns them into cards and questions.'
          : 'No sources match your search.'
      }}
    </li>
  </ul>
</template>
