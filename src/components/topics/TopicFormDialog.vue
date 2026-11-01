<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import FormError from '@/components/FormError.vue'
import NotesField from '@/components/NotesField.vue'
import type { ApiError } from '@/lib/api'

export type TopicFormMode = 'add-topic' | 'edit-topic' | 'add-subtopic' | 'edit-subtopic'

export interface TopicFormValues {
  title: string
  description: string
  notes: string
  /** Used for a main topic; null when you're making a new category for it. */
  categoryId: number | null
  /** The name of that new category. */
  newCategoryName: string
  /** Used for a subtopic: the main topic it belongs to. */
  topicId: number
}

const {
  mode,
  initialValues,
  categoryOptions,
  topicOptions,
  saving = false,
  error = null,
} = defineProps<{
  mode: TopicFormMode
  /** Read once, when the dialog opens. */
  initialValues: TopicFormValues
  /** The categories a main topic can have; you can also make a new one. */
  categoryOptions: SelectOption[]
  /** The main topics a subtopic can belong to. */
  topicOptions: SelectOption[]
  /** While the API saves. */
  saving?: boolean
  /** Why the last save failed; your values stay so you can fix them and try again. */
  error?: ApiError | null
}>()

const emit = defineEmits<{
  save: [values: TopicFormValues]
  close: []
}>()

const titles: Record<TopicFormMode, string> = {
  'add-topic': 'New topic',
  'edit-topic': 'Edit topic',
  'add-subtopic': 'New subtopic',
  'edit-subtopic': 'Edit subtopic',
}

const isAdding = mode === 'add-topic' || mode === 'add-subtopic'
const isSubtopic = mode === 'add-subtopic' || mode === 'edit-subtopic'

// The last option in the category list turns into a name field for a category of your own.
const newCategoryChoice = 'new'
const categoryChoices = computed<SelectOption[]>(() => [
  ...categoryOptions,
  { value: newCategoryChoice, label: 'New category…' },
])

const title = ref(initialValues.title)
const description = ref(initialValues.description)
const notes = ref(initialValues.notes)
// A <select> works with strings; the ids go back to numbers on save.
const categoryChoice = ref<string>(
  initialValues.categoryId === null ? newCategoryChoice : String(initialValues.categoryId),
)
const newCategoryName = ref(initialValues.newCategoryName)
const topicId = ref<string>(String(initialValues.topicId))

const isNewCategory = computed<boolean>(
  () => !isSubtopic && categoryChoice.value === newCategoryChoice,
)

// A subtopic's notes are only your own: the tutor's notes and file parts are separate sources that
// saving never touches. A topic's source is split into subtopics first.
const notesHints: Record<TopicFormMode, string> = {
  'add-topic':
    'After you save, Sprout suggests subtopics from this and makes cards for the ones you keep.',
  'edit-topic':
    'After you save, Sprout suggests subtopics from this and makes cards for the ones you keep.',
  'add-subtopic': 'Sprout turns these into flashcards and questions after you save.',
  'edit-subtopic':
    'Sprout turns these into flashcards and questions after you save. Notes from the chat and your files stay as they are, on the Sources tab.',
}
const notesHint = notesHints[mode]

const canSave = computed<boolean>(
  () =>
    !saving &&
    title.value.trim() !== '' &&
    (!isNewCategory.value || newCategoryName.value.trim() !== ''),
)

// Field errors show next to their field. The rest (too many saves, the AI being unavailable ...)
// needs a message of its own above the buttons.
const generalError = computed<string | null>(() => {
  if (error === null) {
    return null
  }

  return error.hasFieldErrors ? null : error.message
})

function save(): void {
  if (!canSave.value) {
    return
  }

  emit('save', {
    title: title.value.trim(),
    description: description.value.trim(),
    notes: notes.value.trim(),
    categoryId: isNewCategory.value ? null : Number(categoryChoice.value),
    newCategoryName: isNewCategory.value ? newCategoryName.value.trim() : '',
    topicId: Number(topicId.value),
  })
}
</script>

<template>
  <BaseDialog :title="titles[mode]" size="lg" :closable="!saving" @close="emit('close')">
    <form class="flex flex-col gap-5" novalidate @submit.prevent="save">
      <!-- The dialog focuses this when it opens, instead of its close button. -->
      <BaseInput
        v-model="title"
        autofocus
        label="Name"
        :placeholder="isSubtopic ? 'e.g. The Calvin cycle' : 'e.g. Astronomy'"
        :error="error?.fieldError('title')"
        data-test="name"
      />

      <BaseSelect
        v-if="isSubtopic"
        v-model="topicId"
        label="Main topic"
        :options="topicOptions"
        :error="error?.fieldError('topic_id')"
        data-test="main-topic"
      />
      <BaseSelect
        v-else
        v-model="categoryChoice"
        label="Category"
        :options="categoryChoices"
        :error="error?.fieldError('category_id')"
        data-test="category"
      />
      <BaseInput
        v-if="isNewCategory"
        v-model="newCategoryName"
        label="Category name"
        placeholder="e.g. Music"
        :error="error?.fieldError('category_name')"
        data-test="new-category"
      />

      <BaseTextarea
        v-model="description"
        label="What should it cover?"
        placeholder="A sentence or two is enough. Sprout uses this to plan questions."
        rows="3"
        :error="error?.fieldError('description')"
        data-test="description"
      />

      <NotesField
        v-model="notes"
        :label="isSubtopic ? 'Your notes' : 'Notes or a source'"
        :hint="notesHint"
        :maximum-length="isSubtopic ? 10_000 : 30_000"
        :error="error?.fieldError('notes')"
        data-test="notes"
      />

      <FormError v-if="generalError" :message="generalError" />
      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" :disabled="saving" @click="emit('close')">Cancel</BaseButton>
        <BaseButton type="submit" icon="check" :disabled="!canSave" data-test="save">
          <template v-if="saving">Saving…</template>
          <template v-else>{{ isAdding ? 'Add to library' : 'Save changes' }}</template>
        </BaseButton>
      </div>
    </form>
  </BaseDialog>
</template>
