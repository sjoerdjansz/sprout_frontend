<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseInput from '@/components/BaseInput.vue'
import FormError from '@/components/FormError.vue'

const { email, deleting, error, emailError } = defineProps<{
  /** Your account's email, which you type to confirm. */
  email: string
  deleting: boolean
  /** Why deleting failed; nothing was deleted. */
  error: string | null
  emailError?: string
}>()

const emit = defineEmits<{
  confirm: [typedEmail: string]
  close: []
}>()

const typedEmail = ref('')

// The same rule as the API: case and surrounding spaces don't matter.
const matches = computed<boolean>(
  () => typedEmail.value.trim().toLowerCase() === email.trim().toLowerCase(),
)
</script>

<template>
  <BaseDialog title="Delete your account?" :closable="!deleting" @close="emit('close')">
    <p class="text-body text-ink-muted">
      Your account and everything in it go right away and for good: topics, cards, questions, chats,
      progress and uploaded files. Every sign in stops working.
    </p>

    <form class="flex flex-col gap-6" novalidate @submit.prevent="emit('confirm', typedEmail)">
      <BaseInput
        v-model="typedEmail"
        label="Type your email to confirm"
        type="email"
        autocomplete="off"
        :placeholder="email"
        :error="emailError"
        data-test="confirm-email"
      />

      <FormError v-if="error" :message="error" />

      <div class="flex justify-end gap-2">
        <BaseButton variant="secondary" :disabled="deleting" @click="emit('close')">
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          variant="danger"
          icon="trash-2"
          :disabled="deleting || !matches"
          data-test="confirm-delete"
        >
          {{ deleting ? 'Deleting…' : 'Delete my account' }}
        </BaseButton>
      </div>
    </form>
  </BaseDialog>
</template>
