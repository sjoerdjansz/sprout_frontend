<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'

// Gives the first link a chance to arrive, and keeps resends under the API's limit of 3 a minute.
const waitSeconds = 45

const {
  busy = false,
  sent = false,
  error = null,
} = defineProps<{
  busy?: boolean
  /** The last resend went through. */
  sent?: boolean
  /** Why the last resend failed. */
  error?: string | null
}>()

const emit = defineEmits<{
  resend: []
}>()

const secondsLeft = ref(waitSeconds)
let timer: ReturnType<typeof setInterval> | undefined

const countdown = computed<string>(() => {
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

function startCountdown(): void {
  clearInterval(timer)
  secondsLeft.value = waitSeconds
  timer = setInterval(() => {
    secondsLeft.value -= 1

    if (secondsLeft.value === 0) {
      clearInterval(timer)
    }
  }, 1000)
}

function resend(): void {
  emit('resend')
  startCountdown()
}

onMounted(startCountdown)
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="flex w-full flex-col items-center gap-3" aria-live="polite">
    <BaseButton v-if="secondsLeft > 0" variant="secondary" icon="timer" disabled data-test="resend">
      Resend in {{ countdown }}
    </BaseButton>
    <BaseButton
      v-else
      variant="secondary"
      icon="rotate-ccw"
      :disabled="busy"
      data-test="resend"
      @click="resend"
    >
      Resend link
    </BaseButton>

    <BaseBadge v-if="sent" tone="sprout" icon="check">New link on its way</BaseBadge>
    <FormError v-if="error" :message="error" class="text-left" />
  </div>
</template>
