<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import FormError from '@/components/FormError.vue'
import InterestPicker from '@/components/auth/InterestPicker.vue'
import type { ApiError } from '@/lib/api'
import { emailError } from '@/lib/email'
import type { Interest, Registration } from '@/stores/auth'

const { busy = false, error = null } = defineProps<{
  busy?: boolean
  /** The API's answer to the last submit, shown next to the field it is about. */
  error?: ApiError | null
}>()

const emit = defineEmits<{
  submit: [registration: Registration]
}>()

const name = ref('')
const email = ref('')
const interests = ref<Interest[]>([])
const wantsDailyReminder = ref(true)

const localNameError = ref<string | null>(null)
const localEmailError = ref<string | null>(null)

function submit(): void {
  localNameError.value = name.value.trim() === '' ? 'Tell us what to call you.' : null
  localEmailError.value = emailError(email.value)

  if (localNameError.value !== null || localEmailError.value !== null) {
    return
  }

  emit('submit', {
    name: name.value.trim(),
    email: email.value.trim(),
    interests: interests.value,
    wants_daily_reminder: wantsDailyReminder.value,
  })
}
</script>

<template>
  <form class="flex flex-col gap-4.5" novalidate @submit.prevent="submit">
    <BaseInput
      v-model="name"
      label="What should we call you?"
      placeholder="Your first name"
      icon="user-round"
      autocomplete="given-name"
      maxlength="50"
      :error="localNameError ?? error?.fieldError('name')"
      data-test="name"
    />
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

    <InterestPicker v-model="interests" :error="error?.fieldError('interests')" />

    <BaseSwitch v-model="wantsDailyReminder" label="Send me a gentle daily reminder" />

    <FormError v-if="error && !error.hasFieldErrors" :message="error.message" />

    <BaseButton
      type="submit"
      size="lg"
      icon-right="arrow-right"
      block
      class="mt-1"
      :disabled="busy"
      data-test="submit"
    >
      Create my account
    </BaseButton>
    <p class="text-caption font-normal text-ink-subtle">
      By continuing you agree to Sprout’s Terms and Privacy policy.
    </p>
  </form>
</template>
