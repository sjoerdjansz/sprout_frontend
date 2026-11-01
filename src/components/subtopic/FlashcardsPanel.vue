<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import FlashcardEditor from '@/components/subtopic/FlashcardEditor.vue'
import FlashcardRow from '@/components/subtopic/FlashcardRow.vue'
import MaterialToolbar from '@/components/subtopic/MaterialToolbar.vue'
import type { ApiError } from '@/lib/api'
import { filterFlashcards, flashcardFilters, type FlashcardFilter } from '@/lib/subtopicPage'
import type { Flashcard, FlashcardInput } from '@/stores/flashcards'

/** Which card the editor is open for: one of them, or a new one. */
export type CardEditorTarget = number | 'new'

const { cards, editing, saving, editorError, generating, hasSources } = defineProps<{
  cards: Flashcard[]
  /** Null while no editor is open. */
  editing: CardEditorTarget | null
  saving: boolean
  editorError: ApiError | null
  /** While Sprout makes cards from the sources, or is about to. */
  generating: boolean
  /** Without a source there's nothing to generate from (the API refuses it). */
  hasSources: boolean
}>()

const emit = defineEmits<{
  add: []
  edit: [card: Flashcard]
  cancelEdit: []
  save: [input: FlashcardInput]
  togglePause: [card: Flashcard]
  remove: [card: Flashcard]
  generate: []
}>()

const query = ref('')
const filter = ref<FlashcardFilter>('all')

// Adding a card clears the search and filter, so the new card can't be filtered out of view.
function add(): void {
  query.value = ''
  filter.value = 'all'
  emit('add')
}

const shownCards = computed<Flashcard[]>(() => filterFlashcards(cards, query.value, filter.value))

const emptyMessage = computed<string>(() =>
  cards.length === 0
    ? generating
      ? 'No cards yet. They show up here once Sprout has made them.'
      : hasSources
        ? 'No cards yet. Add one, or generate them from your sources.'
        : 'No cards yet. Add one, or add your notes on the Sources tab so Sprout can make them.'
    : 'No cards match. Clear the filter, or add one.',
)
</script>

<template>
  <MaterialToolbar
    v-model:query="query"
    v-model:filter="filter"
    search-label="Search cards"
    :filters="flashcardFilters"
  >
    <BaseButton
      variant="ghost"
      size="sm"
      icon="sparkles"
      :disabled="generating || !hasSources"
      :title="hasSources ? undefined : 'Add a source first, so Sprout has something to work from.'"
      data-test="generate"
      @click="emit('generate')"
    >
      {{ generating ? 'Making cards…' : 'Generate from sources' }}
    </BaseButton>
    <BaseButton size="sm" icon="plus" data-test="add-card" @click="add">Add card</BaseButton>
  </MaterialToolbar>

  <ul class="flex flex-col gap-0.5 p-2">
    <li v-if="editing === 'new'">
      <FlashcardEditor
        :saving="saving"
        :error="editorError"
        @save="(input) => emit('save', input)"
        @cancel="emit('cancelEdit')"
      />
    </li>

    <template v-for="card in shownCards" :key="card.id">
      <li v-if="editing === card.id">
        <FlashcardEditor
          :initial-values="{ front: card.front, back: card.back }"
          :saving="saving"
          :error="editorError"
          @save="(input) => emit('save', input)"
          @cancel="emit('cancelEdit')"
        />
      </li>
      <FlashcardRow
        v-else
        :card="card"
        @edit="emit('edit', card)"
        @toggle-pause="emit('togglePause', card)"
        @remove="emit('remove', card)"
      />
    </template>

    <li
      v-if="shownCards.length === 0 && editing !== 'new'"
      class="px-4 py-8 text-center text-[14px] text-ink-muted"
      data-test="empty"
    >
      {{ emptyMessage }}
    </li>
  </ul>
</template>
