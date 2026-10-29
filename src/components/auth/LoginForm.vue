<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseInput from '@/components/BaseInput.vue'
import FormError from '@/components/FormError.vue'
import type { ApiError } from '@/lib/api'
import { emailError } from '@/lib/email'

const { busy = false, error = null } = defineProps<{
  busy?: boolean
  /** The API's answer to the last submit, shown next to the field it is about. */
  error?: ApiError | null
}>()

const emit = defineEmits<{
  submit: [email: string]
}>()

const email = ref('')
const localEmailError = ref<string | null>(null)

function submit(): void {
  localEmailError.value = emailError(email.value)

  if (localEmailError.value === null) {
    emit('submit', email.value.trim())
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <BaseInput
      v-model="email"
      label="Email"
      type="email"
      placeholder="you@example.com"
      icon="mail"
      autocomplete="email"
      :error="localEmailError ?? error?.fieldError('email')"
      data-test="email"
    />

    <FormError v-if="error && !error.hasFieldErrors" :message="error.message" />

    <BaseButton
      type="submit"
      size="lg"
      icon-right="arrow-right"
      block
      :disabled="busy"
      data-test="submit"
    >
      Send magic link
    </BaseButton>

    <p class="flex items-center gap-1.5 text-label font-normal text-ink-subtle">
      <BaseIcon name="lock" :size="14" />
      The link works once and expires in 15 minutes.
    </p>
  </form>
</template>
