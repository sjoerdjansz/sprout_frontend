<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import FormError from '@/components/FormError.vue'

const { title, deleting, error } = defineProps<{
  /** The subtopic's name. */
  title: string
  deleting: boolean
  /** Why deleting failed; nothing was deleted. */
  error: string | null
}>()

const emit = defineEmits<{
  confirm: []
  close: []
}>()
</script>

<template>
  <BaseDialog :title="`Delete ${title}?`" :closable="!deleting" @close="emit('close')">
    <p class="text-body text-ink-muted">
      This removes its flashcards, questions and your progress on it. The topic and its other
      subtopics stay. You can’t undo this.
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
        data-test="confirm-delete"
        @click="emit('confirm')"
      >
        {{ deleting ? 'Deleting…' : 'Delete subtopic' }}
      </BaseButton>
    </div>
  </BaseDialog>
</template>
