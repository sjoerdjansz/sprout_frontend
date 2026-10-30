import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { SelectOption } from '@/components/BaseSelect.vue'
import type { TopicFormValues } from '@/components/knowledgeMap/TopicFormDialog.vue'
import { addedMaterialToast } from '@/composables/subtopic/useGenerateMaterial'
import type { SubtopicPageActions } from '@/composables/subtopic/useSubtopicLoader'
import type { Toast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { useTopicsStore, type SubtopicDetail } from '@/stores/topics'

/** Editing the subtopic (name, main topic, description and notes) in a dialog. */
export function useEditSubtopic(
  subtopic: Ref<SubtopicDetail | null>,
  actions: SubtopicPageActions,
  showToast: (toast: Toast) => void,
): {
  isOpen: Ref<boolean>
  saving: Ref<boolean>
  /** Why the last save failed; the form keeps your values. */
  error: Ref<ApiError | null>
  /** The form filled with the subtopic as it is now. */
  initialValues: ComputedRef<TopicFormValues | null>
  /** The main topics it can move to. */
  topicOptions: ComputedRef<SelectOption[]>
  open: () => Promise<void>
  close: () => void
  save: (values: TopicFormValues) => Promise<void>
} {
  const topicsStore = useTopicsStore()

  const isOpen = ref(false)
  const saving = ref(false)
  const error = ref<ApiError | null>(null)

  const initialValues = computed<TopicFormValues | null>(() => {
    const current = subtopic.value
    if (current === null) {
      return null
    }

    return {
      title: current.title,
      description: current.description ?? '',
      notes: current.notes ?? '',
      categoryId: current.topic.category.id,
      newCategoryName: '',
      topicId: current.topic.id,
    }
  })

  const topicOptions = computed<SelectOption[]>(() =>
    topicsStore.topics.map((topic) => ({ value: String(topic.id), label: topic.title })),
  )

  async function open(): Promise<void> {
    actions.clearActionError()
    error.value = null

    // The form lets you move the subtopic, so it needs your topics.
    if (topicsStore.topics.length === 0) {
      try {
        await topicsStore.fetchLibrary()
      } catch (caught) {
        actions.failAction(caught)

        return
      }
    }
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
  }

  async function save(values: TopicFormValues): Promise<void> {
    saving.value = true
    error.value = null

    try {
      const result = await topicsStore.updateSubtopic(actions.subtopicId(), {
        topicId: values.topicId,
        title: values.title,
        description: values.description,
        notes: values.notes,
      })
      close()
      if (result.added.flashcards + result.added.questions > 0) {
        showToast(addedMaterialToast(result.added))
      }
      // New notes can add material, and a new main topic brings other sessions.
      await actions.reload()
    } catch (caught) {
      if (caught instanceof ApiError && caught.status !== 404) {
        // Nothing was saved; the form keeps your values so you can fix them and try again.
        error.value = caught
      } else {
        close()
        actions.failAction(caught)
      }
    } finally {
      saving.value = false
    }
  }

  return { isOpen, saving, error, initialValues, topicOptions, open, close, save }
}
