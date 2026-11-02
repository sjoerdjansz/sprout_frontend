<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import DeleteSubtopicDialog from '@/components/subtopic/DeleteSubtopicDialog.vue'
import SubtopicToolbar from '@/components/topic/SubtopicToolbar.vue'
import TopicHeader from '@/components/topic/TopicHeader.vue'
import DeleteTopicDialog from '@/components/topics/DeleteTopicDialog.vue'
import SubtopicList from '@/components/topics/SubtopicList.vue'
import SubtopicSuggestionsDialog from '@/components/topics/SubtopicSuggestionsDialog.vue'
import TopicFormDialog from '@/components/topics/TopicFormDialog.vue'
import { useDeleteSubtopicFromList } from '@/composables/topics/useDeleteSubtopicFromList'
import { useDeleteTopic } from '@/composables/topics/useDeleteTopic'
import { useSubtopicSuggestions } from '@/composables/topics/useSubtopicSuggestions'
import { useTopicForm } from '@/composables/topics/useTopicForm'
import { useGenerationPolling } from '@/composables/useGenerationPolling'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { filterSubtopics, subtopicFilterCounts, type SubtopicFilter } from '@/lib/topics'
import { useTopicsStore, type Subtopic, type Topic } from '@/stores/topics'
import NotFoundView from '@/views/NotFoundView.vue'

const { id } = defineProps<{
  id: number
}>()

const router = useRouter()
const topicsStore = useTopicsStore()
const { toast, showToast } = useToast()
const suggestions = useSubtopicSuggestions(showToast)
const deleteSubtopic = useDeleteSubtopicFromList(showToast)

type LoadState = 'loading' | 'loaded' | 'not-found' | 'failed'

const loadState = ref<LoadState>('loading')
const loadError = ref('')

// The store holds it with the library, so every save, move or delete shows here as well.
const topic = computed<Topic | null>(
  () => topicsStore.topics.find((candidate) => candidate.id === id) ?? null,
)

async function load(): Promise<void> {
  loadState.value = 'loading'

  try {
    await topicsStore.fetchTopic(id)
    loadState.value = 'loaded'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    if (caught.status === 404) {
      loadState.value = 'not-found'

      return
    }
    loadError.value = caught.message
    loadState.value = 'failed'
  }
}

// --- Finding a subtopic

const query = ref('')
const filter = ref<SubtopicFilter>('all')

function clearFilters(): void {
  query.value = ''
  filter.value = 'all'
}

/**
 * Adding a topic with a source on the Topics page brings you here, and Sprout reads that source
 * here, where its subtopics will show. The flag sits in the history entry, so a reload or the
 * back button doesn't start it again.
 */
function startSuggestionsAfterAdding(): void {
  const state: unknown = window.history.state
  const shouldSuggest =
    typeof state === 'object' && state !== null && 'suggestSubtopics' in state
      ? state.suggestSubtopics === true
      : false
  if (!shouldSuggest || topic.value === null) {
    return
  }
  window.history.replaceState({ ...window.history.state, suggestSubtopics: false }, '')
  void suggestions.start({ id: topic.value.id, title: topic.value.title })
}

watch(
  () => id,
  async () => {
    clearFilters()
    await load()
    startSuggestionsAfterAdding()
  },
  { immediate: true },
)

// Subtopics whose cards Sprout is making show that, until the topic says they're done.
const { error: checkError } = useGenerationPolling(
  () =>
    loadState.value === 'loaded' &&
    (topic.value?.subtopics.some((subtopic) => subtopic.generation_status === 'generating') ??
      false),
  async () => {
    await topicsStore.fetchTopic(id)
  },
)

const shownSubtopics = computed<Subtopic[]>(() =>
  filterSubtopics(topic.value?.subtopics ?? [], query.value, filter.value),
)

const filterCounts = computed<Record<SubtopicFilter, number>>(() =>
  subtopicFilterCounts(topic.value?.subtopics ?? []),
)

// --- Practising, editing and deleting

function practise(): void {
  void router.push({ name: 'practice', query: { topic: String(id) } })
}

const topicForm = useTopicForm({
  showToast,
  onSaved: (saved) => {
    if (saved.hasNewSource) {
      void suggestions.start(saved.topic)
    }
  },
})
const { form } = topicForm

// The topic is gone, so its page is too: back to the library, which says what happened.
const deleteTopic = useDeleteTopic((deletedTopic) => {
  void router.push({ name: 'topics', state: { deletedTopic: deletedTopic.title } })
})
</script>

<template>
  <!-- In place, so the URL you opened stays (see ../specs/not-found.md). -->
  <NotFoundView v-if="loadState === 'not-found'" />

  <AppLayout v-else>
    <p v-if="loadState === 'loading'" class="text-ink-muted" aria-live="polite">
      Loading your topic…
    </p>

    <div v-else-if="loadState === 'failed'" class="flex flex-col items-start gap-4">
      <FormError :message="loadError" />
      <BaseButton variant="secondary" icon="rotate-ccw" data-test="retry" @click="load">
        Try again
      </BaseButton>
    </div>

    <div v-else-if="topic !== null" class="flex w-full max-w-260 flex-col gap-4">
      <TopicHeader
        :topic="topic"
        @practice="practise"
        @edit="topicForm.openEditTopic(topic.id)"
        @delete="deleteTopic.open(topic.id)"
      />

      <FormError v-if="topicForm.openError.value" :message="topicForm.openError.value" />
      <FormError
        v-if="checkError"
        :message="`${checkError} Sprout keeps checking on your new cards.`"
        data-test="check-error"
      />

      <section aria-labelledby="subtopics-heading" class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 id="subtopics-heading" class="font-display text-title text-ink">Subtopics</h2>
          <BaseButton
            v-if="topic.subtopics.length > 0"
            variant="ghost"
            size="sm"
            icon="plus"
            data-test="add-subtopic"
            @click="topicForm.openAddSubtopic(topic.id)"
          >
            Add subtopic
          </BaseButton>
        </div>
        <SubtopicToolbar
          v-if="topic.subtopics.length > 0"
          v-model:query="query"
          v-model:filter="filter"
          :counts="filterCounts"
        />
        <SubtopicList
          :subtopics="shownSubtopics"
          :topic-title="topic.title"
          :topic-is-empty="topic.subtopics.length === 0"
          @add-subtopic="topicForm.openAddSubtopic(topic.id)"
          @clear-filters="clearFilters"
          @edit-subtopic="topicForm.openEditSubtopic"
          @delete-subtopic="deleteSubtopic.open"
        />
      </section>
    </div>

    <TopicFormDialog
      v-if="form !== null"
      :mode="form.mode"
      :initial-values="form.values"
      :category-options="topicForm.categoryOptions.value"
      :topic-options="topicForm.topicOptions.value"
      :saving="topicForm.saving.value"
      :error="topicForm.saveError.value"
      @save="topicForm.save"
      @close="topicForm.close"
    />

    <DeleteTopicDialog
      v-if="deleteTopic.topic.value !== null"
      :title="deleteTopic.topic.value.title"
      :subtopic-count="deleteTopic.topic.value.subtopics.length"
      :deleting="deleteTopic.deleting.value"
      :error="deleteTopic.error.value"
      @confirm="deleteTopic.confirm"
      @close="deleteTopic.close"
    />

    <DeleteSubtopicDialog
      v-if="deleteSubtopic.subtopic.value !== null"
      :title="deleteSubtopic.subtopic.value.title"
      :deleting="deleteSubtopic.deleting.value"
      :error="deleteSubtopic.error.value"
      @confirm="deleteSubtopic.confirm"
      @close="deleteSubtopic.close"
    />

    <SubtopicSuggestionsDialog
      v-if="suggestions.topic.value !== null"
      :topic-title="suggestions.topic.value.title"
      :phase="suggestions.phase.value"
      :rows="suggestions.rows.value"
      :error="suggestions.error.value"
      :row-errors="suggestions.rowErrors.value"
      :kept-count="suggestions.keptCount.value"
      :can-add="suggestions.canAdd.value"
      @update-row="suggestions.updateRow"
      @add-own="suggestions.addOwnRow"
      @add="suggestions.add"
      @retry="suggestions.retry"
      @skip="suggestions.close"
    />

    <BaseToast
      v-if="toast !== null"
      :title="toast.title"
      :message="toast.message"
      :tone="toast.tone"
      :icon="toast.icon"
    />
  </AppLayout>
</template>
