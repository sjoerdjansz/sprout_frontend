<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import type { SelectOption } from '@/components/BaseSelect.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import SubtopicList from '@/components/knowledgeMap/SubtopicList.vue'
import TopicFormDialog, {
  type TopicFormMode,
  type TopicFormValues,
} from '@/components/knowledgeMap/TopicFormDialog.vue'
import TopicLibrary from '@/components/knowledgeMap/TopicLibrary.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import {
  describeAdded,
  filterTopics,
  librarySummary,
  needsAttention,
  usedCategories,
  visibleSubtopics,
  type LibraryFilters,
} from '@/lib/knowledgeMap'
import { useTopicsStore, type Category, type Topic } from '@/stores/topics'

const route = useRoute()
const router = useRouter()
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

/**
 * The topic whose subtopics show under the library. It lives in the URL (`?topic=8`), so going
 * back from a subtopic's page, or reloading, keeps your place. Without one, the first topic.
 */
const selectedTopicId = computed<number | null>({
  get: () => {
    const fromUrl = Number(route.query.topic)
    const exists = topicsStore.topics.some((topic) => topic.id === fromUrl)

    return exists ? fromUrl : (topicsStore.topics[0]?.id ?? null)
  },
  // Replace, not push: picking topics shouldn't fill your back button.
  set: (topicId) => {
    void router.replace({ query: topicId === null ? {} : { topic: String(topicId) } })
  },
})

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

onMounted(() => {
  void load()
})

const subtopicList = useTemplateRef<InstanceType<typeof SubtopicList>>('subtopicList')

/**
 * Picks a topic. On a narrow screen its subtopics sit below all the cards, so scroll them into
 * view; when they're already on screen (a wide screen) nothing moves.
 */
async function selectTopic(topicId: number): Promise<void> {
  selectedTopicId.value = topicId
  await nextTick()

  const list: unknown = subtopicList.value?.$el
  if (!(list instanceof HTMLElement) || list.getBoundingClientRect().top < window.innerHeight) {
    return
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  list.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
}

const filteredTopics = computed<Topic[]>(() => filterTopics(topicsStore.topics, filters.value))

/**
 * The topic whose subtopics show: the one you picked, or, when a filter hides it, the first topic
 * that's still visible. So a search for a subtopic shows that subtopic straight away.
 */
const shownTopic = computed<Topic | null>(() => {
  const picked = filteredTopics.value.find((topic) => topic.id === selectedTopicId.value)

  return picked ?? filteredTopics.value[0] ?? null
})

const summary = computed<string>(() => librarySummary(topicsStore.topics))

const attentionCount = computed<number>(
  () => topicsStore.topics.flatMap((topic) => topic.subtopics).filter(needsAttention).length,
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

// --- Adding and editing, in a dialog

interface FormState {
  mode: TopicFormMode
  values: TopicFormValues
}

// Null while no dialog is open.
const form = ref<FormState | null>(null)
const saving = ref(false)
const saveError = ref<ApiError | null>(null)

function openForm(mode: TopicFormMode, topic: Topic | null): void {
  saveError.value = null
  form.value = {
    mode,
    values: {
      title: mode === 'edit-topic' ? (topic?.title ?? '') : '',
      description: mode === 'edit-topic' ? (topic?.description ?? '') : '',
      notes: mode === 'edit-topic' ? (topic?.notes ?? '') : '',
      // The topic's own category, the one you're filtering on, or the first one; with none at
      // all you make one.
      categoryId:
        topic?.category.id ??
        (categoryId.value === 'all' ? (topicsStore.categories[0]?.id ?? null) : categoryId.value),
      newCategoryName: '',
      topicId: topic?.id ?? 0,
    },
  }
}

async function saveForm(mode: TopicFormMode, values: TopicFormValues): Promise<void> {
  if (mode === 'add-subtopic') {
    const result = await topicsStore.addSubtopic({
      topicId: values.topicId,
      title: values.title,
      description: values.description,
      notes: values.notes,
    })
    selectedTopicId.value = result.subtopic.topic_id
    if (result.added.flashcards + result.added.questions > 0) {
      showToast({
        title: `Added ${result.subtopic.title}`,
        message: describeAdded(result.added),
        tone: 'sprout',
        icon: 'sparkles',
      })
    }

    return
  }

  const topicInput = {
    title: values.title,
    description: values.description,
    notes: values.notes,
    categoryId: values.categoryId,
    categoryName: values.newCategoryName,
  }
  const topic =
    mode === 'add-topic'
      ? await topicsStore.addTopic(topicInput)
      : await topicsStore.updateTopic(values.topicId, topicInput)
  selectedTopicId.value = topic.id
}

async function save(values: TopicFormValues): Promise<void> {
  if (form.value === null) {
    return
  }
  saving.value = true
  saveError.value = null

  try {
    await saveForm(form.value.mode, values)
    // Clear the filters so what you just saved is in view.
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
  <AppLayout>
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
        :selected-topic-id="shownTopic?.id ?? null"
        :attention-count="attentionCount"
        @select="selectTopic"
        @add-topic="openForm('add-topic', null)"
        @clear-filters="clearFilters"
      />

      <SubtopicList
        ref="subtopicList"
        v-if="shownTopic !== null"
        :topic="shownTopic"
        :subtopics="visibleSubtopics(shownTopic, filters)"
        @edit-topic="openForm('edit-topic', shownTopic)"
        @add-subtopic="openForm('add-subtopic', shownTopic)"
      />
    </template>

    <TopicFormDialog
      v-if="form !== null"
      :mode="form.mode"
      :initial-values="form.values"
      :category-options="categoryOptions"
      :topic-options="topicOptions"
      :saving="saving"
      :error="saveError"
      @save="save"
      @close="form = null"
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
