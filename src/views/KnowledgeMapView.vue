<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import type { SelectOption } from '@/components/BaseSelect.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import PanelLayout from '@/components/knowledgeMap/PanelLayout.vue'
import PracticePicker from '@/components/knowledgeMap/PracticePicker.vue'
import SubtopicDetails from '@/components/knowledgeMap/SubtopicDetails.vue'
import SubtopicList from '@/components/knowledgeMap/SubtopicList.vue'
import TopicDetails from '@/components/knowledgeMap/TopicDetails.vue'
import TopicForm, {
  type TopicFormMode,
  type TopicFormValues,
} from '@/components/knowledgeMap/TopicForm.vue'
import TopicLibrary from '@/components/knowledgeMap/TopicLibrary.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import {
  describeAdded,
  filterTopics,
  firstSelection,
  librarySummary,
  needsAttention,
  suggestPractice,
  usedCategories,
  visibleSubtopics,
  type LibraryFilters,
  type LibrarySelection,
  type PracticeSuggestion,
} from '@/lib/knowledgeMap'
import {
  useTopicsStore,
  type Category,
  type Subtopic,
  type SubtopicInput,
  type SubtopicSaveResult,
  type Topic,
  type TopicInput,
} from '@/stores/topics'

const topicsStore = useTopicsStore()
const { toast, showToast } = useToast()

type LoadState = 'loading' | 'loaded' | 'failed'

const loadState = ref<LoadState>('loading')
const loadError = ref('')

const query = ref('')
const categoryId = ref<number | 'all'>('all')
const showOnlyAttention = ref(false)

const filters = computed<LibraryFilters>(() => ({
  query: query.value,
  categoryId: categoryId.value,
  needsAttention: showOnlyAttention.value,
}))

function clearFilters(): void {
  query.value = ''
  categoryId.value = 'all'
  showOnlyAttention.value = false
}

// Null only while the library is loading or empty.
const selection = ref<LibrarySelection | null>(null)

interface FormState {
  mode: TopicFormMode
  values: TopicFormValues
  /** The topic or subtopic being edited; null while adding. */
  editingId: number | null
}

// Null while the panel shows details; the add and edit forms take the panel's place.
const form = ref<FormState | null>(null)
const saving = ref(false)
const saveError = ref<ApiError | null>(null)

async function load(): Promise<void> {
  loadState.value = 'loading'

  try {
    await topicsStore.fetchLibrary()
    selection.value = firstSelection(topicsStore.topics)
    loadState.value = 'loaded'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    loadError.value = caught.message
    loadState.value = 'failed'
  }
}

onMounted(() => {
  void load()
})

const selectedSubtopic = computed<Subtopic | null>(() => {
  const current = selection.value
  if (current === null || current.kind !== 'subtopic') {
    return null
  }

  return (
    topicsStore.topics
      .flatMap((topic) => topic.subtopics)
      .find((subtopic) => subtopic.id === current.id) ?? null
  )
})

// The selected topic, or the parent of the selected subtopic. Falls back to the first topic.
const selectedTopic = computed<Topic | null>(() => {
  const subtopic = selectedSubtopic.value
  const topic = topicsStore.topics.find((candidate) =>
    subtopic === null ? candidate.id === selection.value?.id : candidate.id === subtopic.topic_id,
  )

  return topic ?? topicsStore.topics[0] ?? null
})

const filteredTopics = computed<Topic[]>(() => filterTopics(topicsStore.topics, filters.value))

// The subtopics belong to the selected card, so they hide when a filter hides that card.
const showSubtopics = computed<boolean>(
  () => selectedTopic.value !== null && filteredTopics.value.includes(selectedTopic.value),
)

const summary = computed<string>(() => librarySummary(topicsStore.topics))

const attentionCount = computed<number>(
  () => topicsStore.topics.flatMap((topic) => topic.subtopics).filter(needsAttention).length,
)

const suggestion = computed<PracticeSuggestion | null>(() =>
  selectedTopic.value === null
    ? null
    : suggestPractice(selectedTopic.value, selectedSubtopic.value),
)

// Only categories that have topics get a chip; the form offers all of them.
const filterCategories = computed<Category[]>(() =>
  usedCategories(topicsStore.categories, topicsStore.topics),
)

const categoryOptions = computed<SelectOption[]>(() =>
  topicsStore.categories.map((category) => ({ value: String(category.id), label: category.name })),
)

const topicOptions = computed<SelectOption[]>(() =>
  topicsStore.topics.map((topic) => ({ value: String(topic.id), label: topic.title })),
)

// The panel shows the form, or details when there's something to show (also for an empty library,
// so you can add your first topic).
const showPanel = computed<boolean>(() => form.value !== null || selectedTopic.value !== null)

// Remounts the practice picker, so it starts closed with the new suggestion.
const selectionKey = computed<string>(() =>
  selection.value === null ? 'none' : `${selection.value.kind}-${selection.value.id}`,
)

function selectTopic(topicId: number): void {
  selection.value = { kind: 'topic', id: topicId }
  closeForm()
}

function selectSubtopic(subtopicId: number): void {
  selection.value = { kind: 'subtopic', id: subtopicId }
  closeForm()
}

function openForm(state: FormState): void {
  saveError.value = null
  form.value = state
}

function closeForm(): void {
  form.value = null
  saveError.value = null
}

function emptyValues(): TopicFormValues {
  return {
    title: '',
    description: '',
    notes: '',
    // The category you're looking at, else the first one; with none at all you make one.
    categoryId:
      categoryId.value === 'all' ? (topicsStore.categories[0]?.id ?? null) : categoryId.value,
    newCategoryName: '',
    topicId: selectedTopic.value?.id ?? 0,
  }
}

function openAddTopic(): void {
  openForm({ mode: 'add-topic', values: emptyValues(), editingId: null })
}

function openAddSubtopic(): void {
  openForm({ mode: 'add-subtopic', values: emptyValues(), editingId: null })
}

function openEdit(): void {
  const topic = selectedTopic.value
  if (topic === null) {
    return
  }
  const subtopic = selectedSubtopic.value

  openForm(
    subtopic === null
      ? {
          mode: 'edit-topic',
          values: {
            title: topic.title,
            description: topic.description ?? '',
            notes: topic.notes ?? '',
            categoryId: topic.category.id,
            newCategoryName: '',
            topicId: topic.id,
          },
          editingId: topic.id,
        }
      : {
          mode: 'edit-subtopic',
          values: {
            title: subtopic.title,
            description: subtopic.description ?? '',
            notes: subtopic.notes ?? '',
            categoryId: topic.category.id,
            newCategoryName: '',
            topicId: topic.id,
          },
          editingId: subtopic.id,
        },
  )
}

// Says what Sprout made from a subtopic's notes; nothing to say when there were none.
function announceAdded(result: SubtopicSaveResult): void {
  const { flashcards, questions } = result.added
  if (flashcards + questions === 0) {
    return
  }

  showToast({
    title: `Added ${result.subtopic.title}`,
    message: describeAdded(result.added),
    tone: 'sprout',
    icon: 'sparkles',
  })
}

async function saveForm(state: FormState, values: TopicFormValues): Promise<LibrarySelection> {
  const topicInput: TopicInput = {
    title: values.title,
    description: values.description,
    notes: values.notes,
    categoryId: values.categoryId,
    categoryName: values.newCategoryName,
  }
  const subtopicInput: SubtopicInput = {
    topicId: values.topicId,
    title: values.title,
    description: values.description,
    notes: values.notes,
  }

  switch (state.mode) {
    case 'add-topic': {
      const topic = await topicsStore.addTopic(topicInput)

      return { kind: 'topic', id: topic.id }
    }
    case 'edit-topic': {
      const topic = await topicsStore.updateTopic(state.editingId ?? 0, topicInput)

      return { kind: 'topic', id: topic.id }
    }
    case 'add-subtopic': {
      const result = await topicsStore.addSubtopic(subtopicInput)
      announceAdded(result)

      return { kind: 'subtopic', id: result.subtopic.id }
    }
    case 'edit-subtopic': {
      const result = await topicsStore.updateSubtopic(state.editingId ?? 0, subtopicInput)
      announceAdded(result)

      return { kind: 'subtopic', id: result.subtopic.id }
    }
  }
}

async function save(values: TopicFormValues): Promise<void> {
  if (form.value === null) {
    return
  }
  saving.value = true
  saveError.value = null

  try {
    selection.value = await saveForm(form.value, values)
    // Clear the filters so what you just saved is in view, wherever it ended up.
    clearFilters()
    form.value = null
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    // Nothing was saved; the form keeps your values so you can fix them and try again.
    saveError.value = caught
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppLayout aside-label="Topic details">
    <header class="flex flex-none flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h1 class="font-display text-title-lg text-ink">Knowledge map</h1>
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
        v-model:query="query"
        v-model:category-id="categoryId"
        v-model:needs-attention="showOnlyAttention"
        :topics="filteredTopics"
        :library-is-empty="topicsStore.topics.length === 0"
        :filter-categories="filterCategories"
        :selected-topic-id="selectedTopic?.id ?? null"
        :attention-count="attentionCount"
        @select="selectTopic"
        @add-topic="openAddTopic"
        @clear-filters="clearFilters"
      />

      <SubtopicList
        v-if="showSubtopics && selectedTopic !== null"
        :topic="selectedTopic"
        :subtopics="visibleSubtopics(selectedTopic, filters)"
        :selected-subtopic-id="selectedSubtopic?.id ?? null"
        @select="selectSubtopic"
        @add-subtopic="openAddSubtopic"
      />
    </template>

    <BaseToast
      v-if="toast !== null"
      :title="toast.title"
      :message="toast.message"
      :tone="toast.tone"
      :icon="toast.icon"
    />

    <template v-if="loadState === 'loaded' && showPanel" #aside>
      <TopicForm
        v-if="form !== null"
        :key="`${form.mode}-${selectionKey}`"
        :mode="form.mode"
        :initial-values="form.values"
        :category-options="categoryOptions"
        :topic-options="topicOptions"
        :saving="saving"
        :error="saveError"
        @save="save"
        @cancel="closeForm"
      />

      <PanelLayout v-else-if="selectedTopic !== null && suggestion !== null">
        <SubtopicDetails
          v-if="selectedSubtopic !== null"
          :topic="selectedTopic"
          :subtopic="selectedSubtopic"
          @edit="openEdit"
        />
        <TopicDetails v-else :topic="selectedTopic" @edit="openEdit" />

        <template #footer>
          <PracticePicker
            :key="selectionKey"
            :suggestion="suggestion"
            :subject-title="selectedSubtopic?.title ?? selectedTopic.title"
          />
        </template>
      </PanelLayout>
    </template>
  </AppLayout>
</template>
