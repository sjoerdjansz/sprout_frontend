<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import FormError from '@/components/FormError.vue'
import { pluralize } from '@/lib/topics'

const { title, subtopicCount, deleting, error } = defineProps<{
  /** The topic's name. */
  title: string
  subtopicCount: number
  deleting: boolean
  /** Why deleting failed; nothing was deleted. */
  error: string | null
}>()

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const whatGoes = computed<string>(() =>
  subtopicCount === 0
    ? 'This removes the topic and the chats about it.'
    : `This removes its ${pluralize(subtopicCount, 'subtopic')} with their flashcards, questions, sources and your progress, and the chats and practice sessions about this topic.`,
)
</script>

<!-- What goes and what stays follows `DELETE /topics/{id}` in API.md. -->
<template>
  <BaseDialog :title="`Delete ${title}?`" :closable="!deleting" @close="emit('close')">
    <p class="text-body text-ink-muted" data-test="delete-topic-what-goes">
      {{ whatGoes }} Your XP and streak stay. You can’t undo this.
    </p>

    <FormError v-if="error" :message="error" />

    <div class="flex justify-end gap-2">
      <BaseButton variant="secondary" :disabled="deleting" @click="emit('close')">
        Cancel
      </BaseButton>
      <BaseButton
        variant="danger"
        icon="trash-2"
        :disabled="deleting"
        data-test="confirm-delete-topic"
        @click="emit('confirm')"
      >
        {{ deleting ? 'Deleting…' : 'Delete topic' }}
      </BaseButton>
    </div>
  </BaseDialog>
</template>
