<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import MarkdownContent from '@/components/chat/MarkdownContent.vue'
import MaterialRow from '@/components/subtopic/MaterialRow.vue'
import MaterialToolbar from '@/components/subtopic/MaterialToolbar.vue'
import { pluralize } from '@/lib/knowledgeMap'
import { relativeTime } from '@/lib/relativeTime'
import {
  filterSources,
  sourceFilters,
  sourceLabel,
  sourceLooks,
  wordCount,
  type SourceFilter,
} from '@/lib/subtopicPage'
import type { SubtopicSource } from '@/stores/topics'

const { sources, generating, hasSources } = defineProps<{
  /** What the cards and questions are made from: the tutor's notes, yours, and file parts. */
  sources: SubtopicSource[]
  /** While Sprout makes cards from the sources, or is about to. */
  generating: boolean
  /** Whether the API counts any source; nothing to generate from without one. */
  hasSources: boolean
}>()

const emit = defineEmits<{
  /** Adding and editing your own notes both go through the subtopic form. */
  editNotes: []
  generate: []
  remove: [source: SubtopicSource]
}>()

const query = ref('')
const filter = ref<SourceFilter>('all')
// One source open at a time, like the questions.
const expandedId = ref<number | null>(null)

const shownSources = computed<SubtopicSource[]>(() =>
  filterSources(sources, query.value, filter.value),
)

// Your own notes are the one source you write yourself; there's at most one.
const hasOwnNotes = computed<boolean>(() => sources.some((source) => source.type === 'own'))

function toggle(sourceId: number): void {
  expandedId.value = expandedId.value === sourceId ? null : sourceId
}

function contentId(source: SubtopicSource): string {
  return `source-content-${source.id}`
}
</script>

<template>
  <MaterialToolbar
    v-model:query="query"
    v-model:filter="filter"
    search-label="Search sources"
    :filters="sourceFilters"
  >
    <BaseButton
      variant="ghost"
      size="sm"
      icon="sparkles"
      :disabled="generating || !hasSources"
      data-test="generate-from-sources"
      @click="emit('generate')"
    >
      {{ generating ? 'Making cards…' : 'Generate from sources' }}
    </BaseButton>
    <BaseButton
      v-if="!hasOwnNotes"
      size="sm"
      icon="plus"
      data-test="add-notes"
      @click="emit('editNotes')"
    >
      Add your notes
    </BaseButton>
  </MaterialToolbar>

  <ul class="flex flex-col gap-0.5 p-2">
    <MaterialRow
      v-for="source in shownSources"
      :key="source.id"
      :icon="sourceLooks[source.type].icon"
      :tint="sourceLooks[source.type].tint"
      :highlighted="expandedId === source.id"
      data-test="source"
    >
      <button
        type="button"
        :aria-expanded="expandedId === source.id"
        :aria-controls="contentId(source)"
        class="flex cursor-pointer flex-col gap-0.5 rounded-sm text-left"
        @click="toggle(source.id)"
      >
        <b class="text-[15px] leading-5 font-[650] break-words text-ink" data-test="source-label">
          {{ sourceLabel(source) }}
        </b>
        <span class="text-label font-normal text-ink-muted">
          {{ sourceLooks[source.type].kind }} · {{ pluralize(wordCount(source.content), 'word') }}
        </span>
      </button>
      <div
        v-if="expandedId === source.id"
        :id="contentId(source)"
        class="mt-2.5 max-w-180 rounded-sm bg-surface px-3 py-2.5 text-[14px] leading-5 text-ink"
        data-test="source-content"
      >
        <MarkdownContent :source="source.content" />
      </div>

      <template #meta>
        <span class="text-caption font-normal text-ink-subtle">
          Updated {{ relativeTime(source.updated_at) }}
        </span>
      </template>

      <template #actions>
        <BaseIconButton
          icon="eye"
          :label="expandedId === source.id ? 'Hide source' : 'Show source'"
          size="sm"
          data-test="show-source"
          @click="toggle(source.id)"
        />
        <!-- Only your own notes can be edited: the chat's notes and a file's words stay theirs. -->
        <BaseIconButton
          v-if="source.type === 'own'"
          icon="pencil"
          label="Edit notes"
          size="sm"
          data-test="edit-notes"
          @click="emit('editNotes')"
        />
        <BaseIconButton
          icon="trash-2"
          :label="`Remove ${sourceLabel(source)}`"
          size="sm"
          data-test="remove-source"
          @click="emit('remove', source)"
        />
      </template>
    </MaterialRow>

    <li
      v-if="shownSources.length === 0"
      class="flex flex-col items-center gap-3 px-4 py-8 text-center text-[14px] text-ink-muted"
      data-test="empty"
    >
      <template v-if="sources.length === 0">
        <p>
          No sources yet. Add your notes, or attach a file in the chat, and Sprout turns them into
          cards and questions.
        </p>
        <BaseButton size="sm" icon="plus" data-test="empty-add-notes" @click="emit('editNotes')">
          Add your notes
        </BaseButton>
      </template>
      <p v-else>No sources match your search.</p>
    </li>
  </ul>
</template>
