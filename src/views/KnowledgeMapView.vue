<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SelectOption } from '@/components/BaseSelect.vue'
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
import {
  filterTopics,
  librarySummary,
  needsAttention,
  suggestPractice,
  usedCategories,
  visibleSubtopics,
  type LibraryFilters,
  type PracticeSuggestion,
} from '@/lib/knowledgeMap'
import { useTopicsStore, type Category, type Subtopic, type Topic } from '@/stores/topics'

const topicsStore = useTopicsStore()

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

interface Selection {
  kind: 'topic' | 'subtopic'
  id: number
}

// The design opens on a subtopic you're working on, so you see its facets straight away.
const selection = ref<Selection>({ kind: 'subtopic', id: 101 })

interface FormState {
  mode: TopicFormMode
  values: TopicFormValues
  /** The topic or subtopic being edited; null while adding. */
  editingId: number | null
}

// Null while the panel shows details; the add and edit forms take the panel's place.
const form = ref<FormState | null>(null)

const selectedSubtopic = computed<Subtopic | null>(() => {
  if (selection.value.kind !== 'subtopic') {
    return null
  }
  const id = selection.value.id

  return (
    topicsStore.topics.flatMap((topic) => topic.subtopics).find((subtopic) => subtopic.id === id) ??
    null
  )
})

// The selected topic, or the parent of the selected subtopic. Falls back to the first topic.
const selectedTopic = computed<Topic | null>(() => {
  const subtopic = selectedSubtopic.value
  const topic = topicsStore.topics.find((candidate) =>
    subtopic === null
      ? candidate.id === selection.value.id
      : candidate.subtopics.includes(subtopic),
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

// Remounts the practice picker, so it starts closed with the new suggestion.
const selectionKey = computed<string>(() => `${selection.value.kind}-${selection.value.id}`)

function selectTopic(topicId: number): void {
  selection.value = { kind: 'topic', id: topicId }
  form.value = null
}

function selectSubtopic(subtopicId: number): void {
  selection.value = { kind: 'subtopic', id: subtopicId }
  form.value = null
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
  form.value = { mode: 'add-topic', values: emptyValues(), editingId: null }
}

function openAddSubtopic(): void {
  form.value = { mode: 'add-subtopic', values: emptyValues(), editingId: null }
}

function openEdit(): void {
  const topic = selectedTopic.value
  if (topic === null) {
    return
  }
  const subtopic = selectedSubtopic.value

  form.value =
    subtopic === null
      ? {
          mode: 'edit-topic',
          values: {
            title: topic.title,
            description: topic.description,
            notes: topic.notes,
            categoryId: topic.categoryId,
            newCategoryName: '',
            topicId: topic.id,
          },
          editingId: topic.id,
        }
      : {
          mode: 'edit-subtopic',
          values: {
            title: subtopic.title,
            description: subtopic.description,
            notes: subtopic.notes,
            categoryId: topic.categoryId,
            newCategoryName: '',
            topicId: topic.id,
          },
          editingId: subtopic.id,
        }
}

function save(values: TopicFormValues): void {
  if (form.value === null) {
    return
  }
  const { mode, editingId } = form.value
  const isTopicForm = mode === 'add-topic' || mode === 'edit-topic'
  // Only a main topic's form asks for a category, so only it can make a new one.
  const newCategoryId =
    isTopicForm && values.categoryId === null
      ? topicsStore.addCategory(values.newCategoryName)
      : null
  const topicInput = {
    title: values.title,
    description: values.description,
    notes: values.notes,
    categoryId: values.categoryId ?? newCategoryId ?? 0,
  }
  const subtopicInput = {
    title: values.title,
    description: values.description,
    notes: values.notes,
    topicId: values.topicId,
  }

  switch (mode) {
    case 'add-topic':
      selection.value = { kind: 'topic', id: topicsStore.addTopic(topicInput) }
      break
    case 'add-subtopic':
      selection.value = { kind: 'subtopic', id: topicsStore.addSubtopic(subtopicInput) }
      break
    case 'edit-topic':
      topicsStore.updateTopic(editingId ?? 0, topicInput)
      break
    case 'edit-subtopic':
      topicsStore.updateSubtopic(editingId ?? 0, subtopicInput)
      break
  }

  // Clear the filters so what you just saved is in view, wherever it ended up.
  clearFilters()
  form.value = null
}
</script>

<template>
  <AppLayout aside-label="Topic details">
    <header class="flex flex-none flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h1 class="font-display text-title-lg text-ink">Knowledge map</h1>
      <p class="text-label font-normal text-ink-muted" data-test="summary">{{ summary }}</p>
    </header>

    <TopicLibrary
      v-model:query="query"
      v-model:category-id="categoryId"
      v-model:needs-attention="showOnlyAttention"
      :topics="filteredTopics"
      :category-name="topicsStore.categoryName"
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

    <template #aside>
      <TopicForm
        v-if="form !== null"
        :key="`${form.mode}-${selectionKey}`"
        :mode="form.mode"
        :initial-values="form.values"
        :category-options="categoryOptions"
        :topic-options="topicOptions"
        @save="save"
        @cancel="form = null"
      />

      <PanelLayout v-else-if="selectedTopic !== null && suggestion !== null">
        <SubtopicDetails
          v-if="selectedSubtopic !== null"
          :topic="selectedTopic"
          :subtopic="selectedSubtopic"
          @edit="openEdit"
        />
        <TopicDetails
          v-else
          :topic="selectedTopic"
          :category-name="topicsStore.categoryName(selectedTopic.categoryId)"
          @edit="openEdit"
        />

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
