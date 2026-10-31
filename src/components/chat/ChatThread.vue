<script setup lang="ts">
import ChatMessage, { type MessageFile } from '@/components/chat/ChatMessage.vue'
import MarkdownContent from '@/components/chat/MarkdownContent.vue'
import { useAuthStore } from '@/stores/auth'
import type { Technique } from '@/lib/techniques'
import type { Message } from '@/stores/conversations'

/** A practice session's messages also say which technique the tutor applied. */
type ThreadMessage = Message & { technique?: Technique | null }

const {
  messages,
  pendingMessage = null,
  pendingFiles = [],
  userInitials,
} = defineProps<{
  messages: ThreadMessage[]
  /** Your message while the tutor is still answering it; it's only stored once the reply is in. */
  pendingMessage?: string | null
  /** The files going with it. */
  pendingFiles?: MessageFile[]
  userInitials: string
}>()

// Your avatar colour is the same in every chat, so it comes from your account instead of
// being passed down through every page that shows a thread.
const auth = useAuthStore()
</script>

<template>
  <!-- New replies are announced to screen readers as they arrive. -->
  <div class="flex flex-col gap-5" aria-live="polite" data-test="chat-thread">
    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :from="message.role"
      :technique="message.technique"
      :materials="message.materials"
      :initials="userInitials"
      :avatar-color="auth.user?.avatar_color"
      data-test="chat-message"
    >
      <MarkdownContent v-if="message.role === 'tutor'" :source="message.content" />
      <template v-else>{{ message.content }}</template>
    </ChatMessage>

    <template v-if="pendingMessage !== null">
      <ChatMessage
        from="user"
        :initials="userInitials"
        :avatar-color="auth.user?.avatar_color"
        :materials="pendingFiles"
        data-test="pending-message"
        >{{ pendingMessage }}</ChatMessage
      >
      <ChatMessage from="tutor" typing />
    </template>
  </div>
</template>
