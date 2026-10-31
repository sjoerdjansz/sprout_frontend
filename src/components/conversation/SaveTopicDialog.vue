<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import FormError from '@/components/FormError.vue'
import SubtopicFields from '@/components/conversation/SubtopicFields.vue'
import type { ApiError } from '@/lib/api'
import type { Draft, ReviewedDraft } from '@/stores/conversations'
import type { Category } from '@/stores/topics'

const {
  draft,
  categories,
  saving = false,
  error = null,
} = defineProps<{
  /** The tutor's draft, the starting point for your review; null for conversations from before drafts. */
  draft: Draft | null
  /**
   * Your categories, for a new topic to go in; null when this conversation continues a topic,
   * which keeps its category.
   */
  categories: Category[] | null
  saving?: boolean
  error?: ApiError | null
}>()

const emit = defineEmits<{
  save: [reviewedDraft: ReviewedDraft]
  close: []
}>()

interface SubtopicRow {
  /** Only for Vue to keep rows apart while you add and remove them. */
  key: number
  title: string
  content: string
}

// A copy of the draft to edit; the tutor's draft only changes with its next reply.
const title = ref(draft?.title ?? '')
const goalDescription = ref(draft?.goal.description ?? '')
const deadline = ref(draft?.goal.deadline ?? '')
const recallPercentage = ref(draft?.goal.recall_percentage?.toString() ?? '')

// The last option in the category list turns into a name field for a category of your own.
const newCategoryChoice = 'new'
const categoryChoices = computed<SelectOption[]>(() => [
  ...(categories ?? []).map((category) => ({ value: String(category.id), label: category.name })),
  { value: newCategoryChoice, label: 'New category…' },
])

// The tutor's suggestion is usually one of your categories by name, otherwise a new one. Without
// a suggestion it starts on your first category, as the knowledge map's form does.
function initialCategoryChoice(): string {
  const suggestion = draft?.category?.toLowerCase() ?? null
  const suggested = categories?.find((category) => category.name.toLowerCase() === suggestion)
  if (suggested !== undefined) {
    return String(suggested.id)
  }
  if (suggestion === null && categories?.[0] !== undefined) {
    return String(categories[0].id)
  }

  return newCategoryChoice
}

// A <select> works with strings; the id goes back to a number on save.
const categoryChoice = ref<string>(initialCategoryChoice())
const newCategoryName = ref(
  categoryChoice.value === newCategoryChoice ? (draft?.category ?? '') : '',
)
const isNewCategory = computed<boolean>(() => categoryChoice.value === newCategoryChoice)

let nextKey = 0
const subtopics = ref<SubtopicRow[]>(
  (draft?.subtopics ?? []).map((subtopic) => ({ key: nextKey++, ...subtopic })),
)

function addSubtopic(): void {
  subtopics.value.push({ key: nextKey++, title: '', content: '' })
}

function removeSubtopic(key: number): void {
  subtopics.value = subtopics.value.filter((subtopic) => subtopic.key !== key)
}

/** Quick feedback for the date picker; the API checks "after today" itself. */
function tomorrow(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

// Only one of the two: the API answers both together with "pick one or the other".
function categoryFields(): Pick<ReviewedDraft, 'category_id' | 'category_name'> {
  if (categories === null) {
    return {}
  }

  return isNewCategory.value
    ? { category_name: newCategoryName.value.trim() }
    : { category_id: Number(categoryChoice.value) }
}

function save(): void {
  emit('save', {
    title: title.value.trim(),
    ...categoryFields(),
    goal: {
      description: goalDescription.value.trim(),
      deadline: deadline.value,
      // An empty field becomes 0, which the API answers with how to fill it in.
      recall_percentage: Number(recallPercentage.value),
    },
    subtopics: subtopics.value.map((subtopic) => ({
      title: subtopic.title.trim(),
      content: subtopic.content.trim(),
    })),
  })
}

// Field errors show next to their field. The rest (no subtopics, a saved conversation, the AI
// being unavailable ...) needs a message of its own above the button.
const generalError = computed<string | null>(() => {
  if (error === null) {
    return null
  }

  // `subtopics` itself, not `subtopics.0.title`: those show next to their subtopic.
  const errorWithoutField = error.errors['subtopics']?.[0] ?? error.fieldError('conversation')
  if (errorWithoutField !== undefined) {
    return errorWithoutField
  }

  return error.hasFieldErrors ? null : error.message
})
</script>

<template>
  <BaseDialog title="Save to your knowledge map" :closable="!saving" @close="emit('close')">
    <form class="flex flex-col gap-6" novalidate @submit.prevent="save">
      <p class="text-ink-muted">
        Check what the tutor put together. When you save, I’ll turn every subtopic into flashcards
        and questions.
      </p>

      <BaseInput
        v-model="title"
        label="Topic"
        :error="error?.fieldError('title')"
        data-test="topic-title"
      />

      <template v-if="categories !== null">
        <BaseSelect
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
      </template>

      <fieldset class="flex flex-col gap-4">
        <legend class="mb-3 text-heading">Your goal</legend>
        <BaseTextarea
          v-model="goalDescription"
          label="What do you want to know or be able to do?"
          :error="error?.fieldError('goal.description') ?? error?.fieldError('goal')"
          rows="2"
          data-test="goal-description"
        />
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput
            v-model="deadline"
            label="Deadline"
            type="date"
            :min="tomorrow()"
            :error="error?.fieldError('goal.deadline')"
            data-test="goal-deadline"
          />
          <BaseInput
            v-model="recallPercentage"
            label="Remember at least (%)"
            type="number"
            min="1"
            max="100"
            inputmode="numeric"
            :error="error?.fieldError('goal.recall_percentage')"
            data-test="goal-recall"
          />
        </div>
      </fieldset>

      <fieldset class="flex flex-col gap-3">
        <legend class="mb-3 text-heading">Subtopics</legend>
        <SubtopicFields
          v-for="(subtopic, index) in subtopics"
          :key="subtopic.key"
          v-model:title="subtopic.title"
          v-model:content="subtopic.content"
          :position="index + 1"
          :title-error="error?.fieldError(`subtopics.${index}.title`)"
          :content-error="error?.fieldError(`subtopics.${index}.content`)"
          @remove="removeSubtopic(subtopic.key)"
        />
        <BaseButton
          variant="secondary"
          icon="plus"
          class="self-start"
          data-test="add-subtopic"
          @click="addSubtopic"
        >
          Add subtopic
        </BaseButton>
      </fieldset>

      <FormError v-if="generalError" :message="generalError" />

      <div class="flex flex-wrap items-center justify-end gap-3">
        <BaseButton variant="secondary" :disabled="saving" @click="emit('close')">
          Not yet
        </BaseButton>
        <BaseButton type="submit" icon="network" :disabled="saving" data-test="save-topic">
          {{ saving ? 'Saving… this can take a minute or two' : 'Save topic' }}
        </BaseButton>
      </div>
    </form>
  </BaseDialog>
</template>
