<script setup lang="ts">
import ChatMessage from '@/components/chat/ChatMessage.vue'
import MarkdownContent from '@/components/chat/MarkdownContent.vue'
import type { Message } from '@/stores/conversations'

const {
  messages,
  pendingMessage = null,
  userInitials,
} = defineProps<{
  messages: Message[]
  /** Your message while the tutor is still answering it; it's only stored once the reply is in. */
  pendingMessage?: string | null
  userInitials: string
}>()
</script>

<template>
  <!-- New replies are announced to screen readers as they arrive. -->
  <div class="flex flex-col gap-5" aria-live="polite" data-test="chat-thread">
    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :from="message.role"
      :initials="userInitials"
      data-test="chat-message"
    >
      <MarkdownContent v-if="message.role === 'tutor'" :source="message.content" />
      <template v-else>{{ message.content }}</template>
    </ChatMessage>

    <template v-if="pendingMessage !== null">
      <ChatMessage from="user" :initials="userInitials" data-test="pending-message">{{
        pendingMessage
      }}</ChatMessage>
      <ChatMessage from="tutor" typing />
    </template>
  </div>
</template>
