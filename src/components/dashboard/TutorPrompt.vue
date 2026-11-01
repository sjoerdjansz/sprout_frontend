<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import BaseBadge from '@/components/BaseBadge.vue'
import FormError from '@/components/FormError.vue'
import type { MessageFile } from '@/components/chat/ChatMessage.vue'
import ChatThread from '@/components/chat/ChatThread.vue'
import ResumeSession from '@/components/dashboard/ResumeSession.vue'
import type { Attachment } from '@/composables/chat/useComposerAttachments'
import ChatComposer from '@/components/chat/ChatComposer.vue'

export interface LastSession {
  title: string
  lastStudied: string
  to: RouteLocationRaw
}

const {
  pendingMessage = null,
  pendingFiles = [],
  attachments,
  attachmentNotice = null,
  error = null,
  lastSession = null,
  userInitials,
} = defineProps<{
  /** Your first message while the tutor writes its reply. */
  pendingMessage?: string | null
  /** The files going with it. */
  pendingFiles?: MessageFile[]
  /** The files attached to your first message. */
  attachments: Attachment[]
  attachmentNotice?: string | null
  error?: string | null
  /** Your most recent conversation that isn't saved yet. */
  lastSession?: LastSession | null
  userInitials: string
}>()

const emit = defineEmits<{
  send: [text: string]
  attach: [files: File[]]
  removeAttachment: [key: number]
}>()

const message = defineModel<string>({ required: true })
</script>

<template>
  <section
    aria-labelledby="tutor-prompt-heading"
    class="flex flex-col gap-4 rounded-xl bg-surface-tint p-4 md:gap-5 md:p-7"
  >
    <div class="flex flex-col items-start gap-2.5">
      <BaseBadge tone="sky" icon="brain">Socratic tutor</BaseBadge>
      <h2 id="tutor-prompt-heading" class="font-display text-title-lg text-ink">
        What do you want to understand today?
      </h2>
      <p class="text-ink-muted">
        I’ll guide you with questions instead of handing you answers, one step past what you already
        know.
      </p>
    </div>

    <ChatThread
      v-if="pendingMessage !== null"
      :messages="[]"
      :pending-message="pendingMessage"
      :pending-files="pendingFiles"
      :user-initials="userInitials"
      class="py-1"
    />

    <FormError v-if="error" :message="error" />

    <ChatComposer
      v-model="message"
      :disabled="pendingMessage !== null"
      :attachments="attachments"
      :attachment-notice="attachmentNotice"
      placeholder="Ask about a new concept, or something that confuses you…"
      @send="emit('send', $event)"
      @attach="emit('attach', $event)"
      @remove-attachment="emit('removeAttachment', $event)"
    />

    <ResumeSession
      v-if="lastSession"
      :title="lastSession.title"
      :last-studied="lastSession.lastStudied"
      :to="lastSession.to"
    />
  </section>
</template>
