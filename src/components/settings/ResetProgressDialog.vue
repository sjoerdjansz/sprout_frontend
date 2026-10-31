<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import FormError from '@/components/FormError.vue'

const { resetting, error } = defineProps<{
  resetting: boolean
  /** Why resetting failed; nothing was reset. */
  error: string | null
}>()

const emit = defineEmits<{
  confirm: []
  close: []
}>()
</script>

<template>
  <BaseDialog title="Reset your progress?" :closable="!resetting" @close="emit('close')">
    <p class="text-body text-ink-muted">
      This wipes every review, answer, mastery score, streak and XP, and makes every card new again.
      Your topics, cards, questions and chats stay. You can’t undo this.
    </p>

    <FormError v-if="error" :message="error" />

    <div class="flex justify-end gap-2">
      <BaseButton variant="secondary" :disabled="resetting" @click="emit('close')">
        Cancel
      </BaseButton>
      <BaseButton
        icon="rotate-ccw"
        :disabled="resetting"
        data-test="confirm-reset"
        @click="emit('confirm')"
      >
        {{ resetting ? 'Resetting…' : 'Reset progress' }}
      </BaseButton>
    </div>
  </BaseDialog>
</template>
