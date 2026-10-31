<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import { generatingMessage } from '@/lib/knowledgeMap'
import type { GenerationStatus } from '@/stores/topics'

const { status, checkError = null } = defineProps<{
  /** Nothing shows while it's `ready`. */
  status: GenerationStatus
  /** Why asking for the status failed; Sprout keeps asking. */
  checkError?: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <!-- A tinted panel inside the tab's card, never a card of its own. -->
  <div
    v-if="status === 'generating'"
    role="status"
    class="m-2 mb-0 flex items-start gap-3 rounded-md bg-sky-soft px-4 py-3 text-sky-ink"
    data-test="generating"
  >
    <BaseIcon name="sparkles" :size="18" class="mt-0.5 flex-none motion-safe:animate-pulse" />
    <div class="flex flex-col gap-0.5">
      <p class="text-body-strong">{{ generatingMessage }}</p>
      <p class="text-body">Your new flashcards and questions show up here in a moment.</p>
      <p v-if="checkError" class="text-body" data-test="check-error">
        {{ checkError }} Sprout keeps checking in the meantime.
      </p>
    </div>
  </div>

  <div
    v-else-if="status === 'failed'"
    role="alert"
    class="m-2 mb-0 flex flex-wrap items-center gap-3 rounded-md bg-ember-soft px-4 py-3 text-ember-ink"
    data-test="generation-failed"
  >
    <BaseIcon name="circle-help" :size="18" class="flex-none" />
    <div class="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
      <p class="text-body-strong">Sprout couldn't make cards from your notes.</p>
      <p class="text-body">Your notes and existing cards are fine. Try again in a moment.</p>
    </div>
    <BaseButton
      variant="secondary"
      size="sm"
      icon="rotate-ccw"
      data-test="retry-generation"
      @click="emit('retry')"
    >
      Try again
    </BaseButton>
  </div>
</template>
