<script setup lang="ts">
import { useTemplateRef } from 'vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import SuggestionChip from '@/components/chat/SuggestionChip.vue'
import type { IconName } from '@/components/icons'

/** A quick start above the message box. */
export interface Suggestion {
  label: string
  icon?: IconName
  /** The start of a message it puts in the box, for you to finish. */
  message: string
}

const {
  placeholder = 'Ask anything, or say “quiz me”…',
  suggestions = [],
  disabled = false,
} = defineProps<{
  placeholder?: string
  suggestions?: Suggestion[]
  /** While the tutor is answering: you can't send or edit. Read-only keeps focus in the box. */
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

// The parent owns the text, so it can clear it once a message is sent and put it back if
// sending fails.
const message = defineModel<string>({ required: true })

const input = useTemplateRef<HTMLTextAreaElement>('input')

function send(): void {
  const text = message.value.trim()
  if (disabled || text === '') {
    return
  }

  emit('send', text)
}

function sendOnEnter(event: KeyboardEvent): void {
  // Shift+Enter adds a new line instead.
  if (event.shiftKey) {
    return
  }

  event.preventDefault()
  send()
}

function useSuggestion(suggestion: Suggestion): void {
  message.value = suggestion.message
  input.value?.focus()
}
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 shadow-md focus-within:border-line-strong"
  >
    <div v-if="suggestions.length > 0" class="flex flex-wrap gap-2 px-1">
      <SuggestionChip
        v-for="suggestion in suggestions"
        :key="suggestion.label"
        :label="suggestion.label"
        :icon="suggestion.icon"
        :disabled="disabled"
        data-test="suggestion"
        @click="useSuggestion(suggestion)"
      />
    </div>

    <div class="flex items-end gap-2">
      <textarea
        ref="input"
        v-model="message"
        rows="1"
        :placeholder="placeholder"
        :readonly="disabled"
        aria-label="Message Sprout"
        data-test="composer-input"
        class="field-sizing-content max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-body-lg leading-6 text-ink outline-none placeholder:text-ink-subtle focus-visible:shadow-none"
        @keydown.enter="sendOnEnter"
      />
      <BaseIconButton
        icon="arrow-up"
        label="Send"
        variant="primary"
        :disabled="disabled || message.trim() === ''"
        data-test="composer-send"
        @click="send"
      />
    </div>
  </div>
</template>
