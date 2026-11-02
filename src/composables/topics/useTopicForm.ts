import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { SelectOption } from '@/components/BaseSelect.vue'
import type { TopicFormMode, TopicFormValues } from '@/components/topics/TopicFormDialog.vue'
import type { Toast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { useTopicsStore, type Topic } from '@/stores/topics'

export interface TopicFormState {
  mode: TopicFormMode
  values: TopicFormValues
  /** The subtopic being edited; null for the other forms. */
  subtopicId: number | null
}

/** What a save did, for the page to follow up on (show the topic, read its source). */
export interface SavedTopicForm {
  mode: TopicFormMode
  /** The topic the saved item belongs to now. */
  topic: Pick<Topic, 'id' | 'title'>
  /** A topic saved with a new or changed source, for Sprout to split into subtopics next. */
  hasNewSource: boolean
}

/**
 * The add and edit form for topics and subtopics, in a dialog: used on the Topics page and on a
 * topic's own page. The forms list every topic and category, so after opening a topic page
 * directly the library is loaded first.
 */
export function useTopicForm(options: {
  showToast: (toast: Toast) => void
  /** The category a new topic starts in: the one you're filtering on, or none. */
  preferredCategoryId?: () => number | null
  onSaved: (saved: SavedTopicForm) => void
}): {
  /** Null while no dialog is open. */
  form: Ref<TopicFormState | null>
  saving: Ref<boolean>
  saveError: Ref<ApiError | null>
  /** Why the library needed for the form couldn't load. */
  openError: Ref<string | null>
  categoryOptions: ComputedRef<SelectOption[]>
  topicOptions: ComputedRef<SelectOption[]>
  openAddTopic: () => Promise<void>
  openEditTopic: (topicId: number) => Promise<void>
  openAddSubtopic: (topicId: number) => Promise<void>
  openEditSubtopic: (subtopicId: number) => Promise<void>
  close: () => void
  save: (values: TopicFormValues) => Promise<void>
} {
  const topicsStore = useTopicsStore()

  const form = ref<TopicFormState | null>(null)
  const saving = ref(false)
  const saveError = ref<ApiError | null>(null)
  const openError = ref<string | null>(null)

  const categoryOptions = computed<SelectOption[]>(() =>
    topicsStore.categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  )

  const topicOptions = computed<SelectOption[]>(() =>
    topicsStore.topics.map((topic) => ({ value: String(topic.id), label: topic.title })),
  )

  async function ensureLibrary(): Promise<boolean> {
    openError.value = null
    if (topicsStore.libraryLoaded) {
      return true
    }
    try {
      await topicsStore.fetchLibrary()

      return true
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      openError.value = caught.message

      return false
    }
  }

  function findTopic(topicId: number): Topic | null {
    return topicsStore.topics.find((topic) => topic.id === topicId) ?? null
  }

  function show(mode: TopicFormMode, values: TopicFormValues, subtopicId: number | null): void {
    saveError.value = null
    form.value = { mode, values, subtopicId }
  }

  function emptyValues(): TopicFormValues {
    return {
      title: '',
      description: '',
      notes: '',
      categoryId: null,
      newCategoryName: '',
      topicId: 0,
    }
  }

  async function openAddTopic(): Promise<void> {
    if (!(await ensureLibrary())) {
      return
    }
    // The category you're filtering on, or the first one; with none at all you make one.
    const categoryId = options.preferredCategoryId?.() ?? topicsStore.categories[0]?.id ?? null
    show('add-topic', { ...emptyValues(), categoryId }, null)
  }

  async function openEditTopic(topicId: number): Promise<void> {
    if (!(await ensureLibrary())) {
      return
    }
    const topic = findTopic(topicId)
    if (topic === null) {
      return
    }
    show(
      'edit-topic',
      {
        title: topic.title,
        description: topic.description ?? '',
        notes: topic.notes ?? '',
        categoryId: topic.category.id,
        newCategoryName: '',
        topicId: topic.id,
      },
      null,
    )
  }

  async function openAddSubtopic(topicId: number): Promise<void> {
    if (!(await ensureLibrary())) {
      return
    }
    const topic = findTopic(topicId)
    if (topic === null) {
      return
    }
    show('add-subtopic', { ...emptyValues(), categoryId: topic.category.id, topicId }, null)
  }

  // The library has the subtopic's own notes, so the form opens without asking the API first.
  async function openEditSubtopic(subtopicId: number): Promise<void> {
    if (!(await ensureLibrary())) {
      return
    }
    const topic = topicsStore.topics.find((candidate) =>
      candidate.subtopics.some((subtopic) => subtopic.id === subtopicId),
    )
    const subtopic = topic?.subtopics.find((candidate) => candidate.id === subtopicId)
    if (topic === undefined || subtopic === undefined) {
      return
    }
    show(
      'edit-subtopic',
      {
        title: subtopic.title,
        description: subtopic.description ?? '',
        notes: subtopic.notes ?? '',
        categoryId: topic.category.id,
        newCategoryName: '',
        topicId: topic.id,
      },
      subtopicId,
    )
  }

  function close(): void {
    form.value = null
  }

  function showMoved(topicTitle: string): void {
    options.showToast({ title: `Moved to ${topicTitle}`, tone: 'sky', icon: 'arrow-right' })
  }

  async function saveSubtopic(
    state: TopicFormState,
    values: TopicFormValues,
  ): Promise<SavedTopicForm> {
    const input = {
      topicId: values.topicId,
      title: values.title,
      description: values.description,
      notes: values.notes,
    }
    const result =
      state.mode === 'edit-subtopic' && state.subtopicId !== null
        ? await topicsStore.updateSubtopic(state.subtopicId, input)
        : await topicsStore.addSubtopic(input)
    const topic = findTopic(result.subtopic.topic_id)
    const topicTitle = topic?.title ?? ''

    if (state.mode === 'edit-subtopic' && result.subtopic.topic_id !== state.values.topicId) {
      // Its row leaves the list it was in, so say where it went.
      showMoved(topicTitle)
    } else if (
      state.mode === 'add-subtopic' &&
      result.subtopic.generation_status === 'generating'
    ) {
      // Its row shows the cards are coming; the toast says where they come from.
      options.showToast({
        title: `Added ${result.subtopic.title}`,
        message: 'Sprout is making cards from your notes.',
        tone: 'sprout',
        icon: 'sparkles',
      })
    }

    return {
      mode: state.mode,
      topic: { id: result.subtopic.topic_id, title: topicTitle },
      hasNewSource: false,
    }
  }

  async function saveTopic(
    state: TopicFormState,
    values: TopicFormValues,
  ): Promise<SavedTopicForm> {
    const input = {
      title: values.title,
      description: values.description,
      notes: values.notes,
      categoryId: values.categoryId,
      categoryName: values.newCategoryName,
    }
    const topic =
      state.mode === 'add-topic'
        ? await topicsStore.addTopic(input)
        : await topicsStore.updateTopic(values.topicId, input)
    const sourceChanged = state.mode === 'add-topic' || values.notes !== state.values.notes.trim()

    return {
      mode: state.mode,
      topic: { id: topic.id, title: topic.title },
      hasNewSource: values.notes !== '' && sourceChanged,
    }
  }

  async function save(values: TopicFormValues): Promise<void> {
    const state = form.value
    if (state === null) {
      return
    }
    saving.value = true
    saveError.value = null

    try {
      const isSubtopic = state.mode === 'add-subtopic' || state.mode === 'edit-subtopic'
      const saved = isSubtopic ? await saveSubtopic(state, values) : await saveTopic(state, values)
      form.value = null
      options.onSaved(saved)
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

  return {
    form,
    saving,
    saveError,
    openError,
    categoryOptions,
    topicOptions,
    openAddTopic,
    openEditTopic,
    openAddSubtopic,
    openEditSubtopic,
    close,
    save,
  }
}
