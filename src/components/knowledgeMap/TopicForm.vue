<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import PanelLayout from '@/components/knowledgeMap/PanelLayout.vue'

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

const { mode, initialValues, categoryOptions, topicOptions } = defineProps<{
  mode: TopicFormMode
  /** Read once: remount the form (with a `key`) to start over with other values. */
  initialValues: TopicFormValues
  /** The categories a main topic can have; you can also make a new one. */
  categoryOptions: SelectOption[]
  /** The main topics a subtopic can belong to. */
  topicOptions: SelectOption[]
}>()

const emit = defineEmits<{
  save: [values: TopicFormValues]
  cancel: []
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

const canSave = computed<boolean>(
  () => title.value.trim() !== '' && (!isNewCategory.value || newCategoryName.value.trim() !== ''),
)

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
  <form class="flex min-h-0 flex-auto flex-col" novalidate @submit.prevent="save">
    <PanelLayout>
      <div class="flex items-center justify-between gap-3">
        <div class="flex flex-col gap-0.5">
          <span class="text-overline text-ink-subtle uppercase">
            {{ isAdding ? 'Add to your library' : 'Edit' }}
          </span>
          <h2
            class="font-display text-2xl leading-7 font-semibold tracking-[-0.02em] text-ink"
            data-test="form-title"
          >
            {{ titles[mode] }}
          </h2>
        </div>
        <BaseIconButton icon="x" label="Close" data-test="close-form" @click="emit('cancel')" />
      </div>

      <BaseInput
        v-model="title"
        label="Name"
        :placeholder="isSubtopic ? 'e.g. The Calvin cycle' : 'e.g. Astronomy'"
        data-test="name"
      />

      <BaseSelect
        v-if="isSubtopic"
        v-model="topicId"
        label="Main topic"
        :options="topicOptions"
        data-test="main-topic"
      />
      <BaseSelect
        v-else
        v-model="categoryChoice"
        label="Category"
        :options="categoryChoices"
        data-test="category"
      />
      <BaseInput
        v-if="isNewCategory"
        v-model="newCategoryName"
        label="Category name"
        placeholder="e.g. Music"
        data-test="new-category"
      />

      <BaseTextarea
        v-model="description"
        label="What should it cover?"
        placeholder="A sentence or two is enough. Sprout uses this to plan questions."
        rows="3"
        data-test="description"
      />

      <BaseInput
        v-model="notes"
        label="Notes or a source"
        icon="book-open"
        placeholder="Paste a link or some notes"
        hint="Sprout turns these into cards and questions."
        data-test="notes"
      />

      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="ghost" @click="emit('cancel')">Cancel</BaseButton>
          <BaseButton type="submit" icon="check" :disabled="!canSave" data-test="save">
            {{ isAdding ? 'Add to library' : 'Save changes' }}
          </BaseButton>
        </div>
      </template>
    </PanelLayout>
  </form>
</template>
