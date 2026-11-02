<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import DeleteTopicDialog from '@/components/topics/DeleteTopicDialog.vue'
import SubtopicSuggestionsDialog from '@/components/topics/SubtopicSuggestionsDialog.vue'
import TopicFormDialog from '@/components/topics/TopicFormDialog.vue'
import TopicLibrary from '@/components/topics/TopicLibrary.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDeleteTopic } from '@/composables/topics/useDeleteTopic'
import { useSubtopicSuggestions } from '@/composables/topics/useSubtopicSuggestions'
import { useTopicForm, type SavedTopicForm } from '@/composables/topics/useTopicForm'
import { useGenerationPolling } from '@/composables/useGenerationPolling'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import {
  filterTopics,
  librarySummary,
  needsAttention,
  usedCategories,
  type LibraryFilters,
} from '@/lib/topics'
import { useTopicsStore, type Category, type Topic } from '@/stores/topics'

const router = useRouter()
const topicsStore = useTopicsStore()
const { toast, showToast } = useToast()
const suggestions = useSubtopicSuggestions(showToast)

type LoadState = 'loading' | 'loaded' | 'failed'

const loadState = ref<LoadState>('loading')
const loadError = ref('')

const categoryId = ref<number | 'all'>('all')
const showOnlyAttention = ref(false)

const filters = computed<LibraryFilters>(() => ({
  categoryId: categoryId.value,
  needsAttention: showOnlyAttention.value,
}))

function clearFilters(): void {
  categoryId.value = 'all'
  showOnlyAttention.value = false
}

async function load(): Promise<void> {
  loadState.value = 'loading'

  try {
    await topicsStore.fetchLibrary()
    loadState.value = 'loaded'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    loadError.value = caught.message
    loadState.value = 'failed'
  }
}

// Deleting a topic on its own page brings you back here; the history entry says which one.
function showDeletedTopic(): void {
  const state: unknown = window.history.state
  if (typeof state === 'object' && state !== null && 'deletedTopic' in state) {
    if (typeof state.deletedTopic === 'string') {
      showToast({ title: `Deleted ${state.deletedTopic}`, tone: 'sky', icon: 'trash-2' })
      // Once: coming back to this entry later shouldn't say it again.
      window.history.replaceState({ ...state, deletedTopic: null }, '')
    }
  }
}

onMounted(() => {
  showDeletedTopic()
  void load()
})

// Subtopics whose cards Sprout is making show that, until GET /topics says they're done.
const { error: checkError } = useGenerationPolling(
  () =>
    loadState.value === 'loaded' &&
    topicsStore.topics.some((topic) =>
      topic.subtopics.some((subtopic) => subtopic.generation_status === 'generating'),
    ),
  topicsStore.fetchTopics,
)

const filteredTopics = computed<Topic[]>(() => filterTopics(topicsStore.topics, filters.value))

const summary = computed<string>(() => librarySummary(topicsStore.topics))

const attentionCount = computed<number>(
  () => topicsStore.topics.flatMap((topic) => topic.subtopics).filter(needsAttention).length,
)

// Only categories that have topics get a chip; the form offers all of them.
const filterCategories = computed<Category[]>(() =>
  usedCategories(topicsStore.categories, topicsStore.topics),
)

// --- Adding, editing and deleting topics

function afterSave(saved: SavedTopicForm): void {
  // Clear the filters so what you just saved is in view.
  clearFilters()
  if (saved.mode === 'add-topic') {
    // A new topic's subtopics live on its own page; Sprout reads its source there.
    void router.push({
      name: 'topic',
      params: { id: saved.topic.id },
      state: { suggestSubtopics: saved.hasNewSource },
    })

    return
  }
  if (saved.hasNewSource) {
    void suggestions.start(saved.topic)
  }
}

const topicForm = useTopicForm({
  showToast,
  preferredCategoryId: () => (categoryId.value === 'all' ? null : categoryId.value),
  onSaved: afterSave,
})
const { form } = topicForm

const deleteTopic = useDeleteTopic((deletedTopic) => {
  showToast({ title: `Deleted ${deletedTopic.title}`, tone: 'sky', icon: 'trash-2' })
})
</script>

<template>
  <AppLayout>
    <header class="flex flex-none flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h1 class="font-display text-title-lg text-ink">Topics</h1>
      <p
        v-if="loadState === 'loaded'"
        class="text-label font-normal text-ink-muted"
        data-test="summary"
      >
        {{ summary }}
      </p>
    </header>

    <p v-if="loadState === 'loading'" class="text-ink-muted" aria-live="polite">
      Loading your library…
    </p>

    <div v-else-if="loadState === 'failed'" class="flex flex-col items-start gap-4">
      <FormError :message="loadError" />
      <BaseButton variant="secondary" icon="rotate-ccw" data-test="retry" @click="load">
        Try again
      </BaseButton>
    </div>

    <template v-else>
      <TopicLibrary
        v-model:category-id="categoryId"
        v-model:needs-attention="showOnlyAttention"
        :topics="filteredTopics"
        :library-is-empty="topicsStore.topics.length === 0"
        :filter-categories="filterCategories"
        :attention-count="attentionCount"
        @edit-topic="topicForm.openEditTopic"
        @delete-topic="deleteTopic.open"
        @add-topic="topicForm.openAddTopic"
        @clear-filters="clearFilters"
      />

      <FormError
        v-if="checkError"
        :message="`${checkError} Sprout keeps checking on your new cards.`"
        data-test="check-error"
      />
    </template>

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
