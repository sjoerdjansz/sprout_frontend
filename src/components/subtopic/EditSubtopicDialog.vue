<script setup lang="ts">
import { computed } from 'vue'
import BaseDialog from '@/components/BaseDialog.vue'
import type { SelectOption } from '@/components/BaseSelect.vue'
import TopicForm, { type TopicFormValues } from '@/components/knowledgeMap/TopicForm.vue'
import type { ApiError } from '@/lib/api'
import type { SubtopicDetail } from '@/stores/topics'

const { subtopic, topicOptions, saving, error } = defineProps<{
  subtopic: SubtopicDetail
  /** The main topics it can move to. */
  topicOptions: SelectOption[]
  saving: boolean
  error: ApiError | null
}>()

const emit = defineEmits<{
  save: [values: TopicFormValues]
  close: []
}>()

// The knowledge map's subtopic form, filled with this subtopic; read once when the dialog opens.
const initialValues = computed<TopicFormValues>(() => ({
  title: subtopic.title,
  description: subtopic.description ?? '',
  notes: subtopic.notes ?? '',
  categoryId: subtopic.topic.category.id,
  newCategoryName: '',
  topicId: subtopic.topic.id,
}))
</script>

<template>
  <BaseDialog title="Edit subtopic" :closable="!saving" @close="emit('close')">
    <TopicForm
      mode="edit-subtopic"
      :initial-values="initialValues"
      :category-options="[]"
      :topic-options="topicOptions"
      :saving="saving"
      :error="error"
      :framed="false"
      @save="(values) => emit('save', values)"
      @cancel="emit('close')"
    />
  </BaseDialog>
</template>
