<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import FormError from '@/components/FormError.vue'
import type { ApiError } from '@/lib/api'
import type { FlashcardInput } from '@/stores/flashcards'

const {
  initialValues = { front: '', back: '' },
  saving,
  error,
} = defineProps<{
  /** Read once: the card you're editing, or nothing for a new card. */
  initialValues?: FlashcardInput
  saving: boolean
  /** Why the last save failed; your text stays so you can fix it. */
  error: ApiError | null
}>()

const emit = defineEmits<{
  save: [input: FlashcardInput]
  cancel: []
}>()

const front = ref(initialValues.front)
const back = ref(initialValues.back)

const canSave = computed<boolean>(
  () => !saving && front.value.trim() !== '' && back.value.trim() !== '',
)

// Field errors show next to their field; anything else (offline, server trouble) above the buttons.
const generalError = computed<string | null>(() =>
  error === null || error.hasFieldErrors ? null : error.message,
)

function save(): void {
  if (canSave.value) {
    emit('save', { front: front.value.trim(), back: back.value.trim() })
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-md bg-surface-tint p-3.5"
    novalidate
    data-test="card-editor"
    @submit.prevent="save"
  >
    <BaseInput
      v-model="front"
      label="Front"
      placeholder="The question or prompt"
      :error="error?.fieldError('front')"
      data-test="card-front"
    />
    <BaseTextarea
      v-model="back"
      label="Back"
      placeholder="The answer, in one or two lines"
      rows="2"
      :error="error?.fieldError('back')"
      data-test="card-back"
    />
    <FormError v-if="generalError" :message="generalError" />
    <div class="flex justify-end gap-2">
      <BaseButton variant="ghost" size="sm" :disabled="saving" @click="emit('cancel')">
        Cancel
      </BaseButton>
      <BaseButton type="submit" size="sm" icon="check" :disabled="!canSave" data-test="save-card">
        {{ saving ? 'Saving…' : 'Save card' }}
      </BaseButton>
    </div>
  </form>
</template>
