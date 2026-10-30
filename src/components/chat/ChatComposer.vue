<script setup lang="ts">
import { ref } from 'vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import SuggestionChip from '@/components/chat/SuggestionChip.vue'
import type { IconName } from '@/components/icons'

/** A quick start above the message box; picking one puts its label in the box. */
export interface Suggestion {
  label: string
  icon?: IconName
}

const { placeholder = 'Ask anything, or say “quiz me”…', suggestions = [] } = defineProps<{
  placeholder?: string
  suggestions?: Suggestion[]
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const message = ref('')

function send(): void {
  const text = message.value.trim()
  if (text === '') {
    return
  }

  emit('send', text)
  message.value = ''
}

function sendOnEnter(event: KeyboardEvent): void {
  // Shift+Enter adds a new line instead.
  if (event.shiftKey) {
    return
  }

  event.preventDefault()
  send()
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
        data-test="suggestion"
        @click="message = suggestion.label"
      />
    </div>

    <div class="flex items-end gap-2">
      <textarea
        v-model="message"
        rows="1"
        :placeholder="placeholder"
        aria-label="Message Sprout"
        data-test="composer-input"
        class="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-body-lg leading-6 text-ink outline-none placeholder:text-ink-subtle focus-visible:shadow-none"
        @keydown.enter="sendOnEnter"
      />
      <BaseIconButton
        icon="arrow-up"
        label="Send"
        variant="primary"
        :disabled="message.trim() === ''"
        data-test="composer-send"
        @click="send"
      />
    </div>
  </div>
</template>
