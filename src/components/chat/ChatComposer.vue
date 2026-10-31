<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import ComposerAttachments from '@/components/chat/ComposerAttachments.vue'
import SuggestionChip from '@/components/chat/SuggestionChip.vue'
import type { IconName } from '@/components/icons'
import type { Attachment } from '@/composables/chat/useComposerAttachments'
import { acceptAttribute } from '@/lib/attachments'

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
  attachments = null,
  attachmentNotice = null,
} = defineProps<{
  placeholder?: string
  suggestions?: Suggestion[]
  /** While the tutor is answering: you can't send or edit. Read-only keeps focus in the box. */
  disabled?: boolean
  /**
   * The files attached to this message (`useComposerAttachments`, owned by the page that sends).
   * Leave out for a composer that takes no files.
   */
  attachments?: Attachment[] | null
  /** A short note about attaching, such as "Attach up to 5 files per message." */
  attachmentNotice?: string | null
}>()

const emit = defineEmits<{
  send: [text: string]
  attach: [files: File[]]
  removeAttachment: [key: number]
}>()

// The parent owns the text, so it can clear it once a message is sent and put it back if
// sending fails.
const message = defineModel<string>({ required: true })

const input = useTemplateRef<HTMLTextAreaElement>('input')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const canAttach = computed<boolean>(() => attachments !== null)
const hasAttachments = computed<boolean>(() => (attachments?.length ?? 0) > 0)

// Only ready files can be sent, and a message still needs text (the API asks for it).
const waitHint = computed<string | null>(() => {
  const files = attachments ?? []
  if (files.some((file) => file.status === 'uploading' || file.status === 'processing')) {
    return 'Wait until your files are ready.'
  }
  if (files.some((file) => file.status === 'failed')) {
    return "Remove the files Sprout couldn't read."
  }

  return null
})

const canSend = computed<boolean>(
  () => !disabled && waitHint.value === null && message.value.trim() !== '',
)

const shownPlaceholder = computed<string>(() =>
  hasAttachments.value ? 'Say what you want to learn from these files…' : placeholder,
)

function send(): void {
  if (!canSend.value) {
    return
  }

  emit('send', message.value.trim())
}

function attach(files: FileList | null | undefined): void {
  if (!canAttach.value || disabled || files === null || files === undefined || files.length === 0) {
    return
  }
  emit('attach', Array.from(files))
}

function attachPicked(): void {
  attach(fileInput.value?.files)
  // Picking the same file again (after removing it) should work too.
  if (fileInput.value !== null) {
    fileInput.value.value = ''
  }
}

// Dropping files on the composer attaches them; `dragging` shows where they'll land.
const dragging = ref(false)

function dragOver(event: DragEvent): void {
  if (!canAttach.value || disabled || !event.dataTransfer?.types.includes('Files')) {
    return
  }
  event.preventDefault()
  dragging.value = true
}

function drop(event: DragEvent): void {
  dragging.value = false
  if (!canAttach.value) {
    return
  }
  event.preventDefault()
  attach(event.dataTransfer?.files)
}

// Pasting a file attaches it; pasting text works as usual.
function paste(event: ClipboardEvent): void {
  const files = event.clipboardData?.files
  if (!canAttach.value || files === undefined || files.length === 0) {
    return
  }
  event.preventDefault()
  attach(files)
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
    class="flex flex-col gap-2 rounded-xl border bg-surface p-3 shadow-md transition-colors duration-150 ease-default focus-within:border-line-strong"
    :class="
      dragging
        ? 'border-primary bg-surface-tint'
        : ['border-line', { 'hover:border-line-strong': canAttach }]
    "
    data-test="composer"
    @dragover="dragOver"
    @dragleave="dragging = false"
    @drop="drop"
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

    <ComposerAttachments
      v-if="attachments !== null"
      :attachments="attachments"
      :disabled="disabled"
      @remove="emit('removeAttachment', $event)"
    />

    <div class="flex items-end gap-2">
      <template v-if="canAttach">
        <BaseIconButton
          icon="paperclip"
          label="Attach files"
          :disabled="disabled"
          data-test="attach"
          @click="fileInput?.click()"
        />
        <!-- Opened by the button above, so it stays out of the tab order. -->
        <input
          ref="fileInput"
          type="file"
          multiple
          :accept="acceptAttribute"
          tabindex="-1"
          aria-hidden="true"
          class="hidden"
          data-test="file-input"
          @change="attachPicked"
        />
      </template>
      <textarea
        ref="input"
        v-model="message"
        rows="1"
        :placeholder="shownPlaceholder"
        :readonly="disabled"
        aria-label="Message Sprout"
        data-test="composer-input"
        class="field-sizing-content max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-body-lg leading-6 text-ink outline-none placeholder:text-ink-subtle focus-visible:shadow-none"
        @keydown.enter="sendOnEnter"
        @paste="paste"
      />
      <BaseIconButton
        icon="arrow-up"
        label="Send"
        variant="primary"
        :disabled="!canSend"
        data-test="composer-send"
        @click="send"
      />
    </div>

    <div
      v-if="waitHint !== null || attachmentNotice !== null"
      class="flex flex-col gap-0.5 px-2 text-caption text-ink-muted"
      aria-live="polite"
    >
      <p v-if="attachmentNotice !== null" data-test="attachment-notice">{{ attachmentNotice }}</p>
      <p v-if="waitHint !== null" data-test="composer-hint">{{ waitHint }}</p>
    </div>
  </div>
</template>
