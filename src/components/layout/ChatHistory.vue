<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import type { ConversationSummary } from '@/stores/conversations'

const { conversations, error = null } = defineProps<{
  /** Latest activity first. */
  conversations: ConversationSummary[]
  /** Why the history couldn't be loaded. */
  error?: string | null
}>()
</script>

<template>
  <section aria-labelledby="chat-history-heading" class="flex flex-col gap-1">
    <h2 id="chat-history-heading" class="px-3 pb-1 text-overline text-ink-subtle">CHATS</h2>

    <p v-if="error" class="px-3 text-caption font-normal text-ember-ink" data-test="history-error">
      {{ error }}
    </p>

    <p v-else-if="conversations.length === 0" class="px-3 text-caption font-normal text-ink-subtle">
      No chats yet. Ask the tutor something on your dashboard.
    </p>

    <ul v-else class="flex flex-col gap-0.5">
      <li v-for="conversation in conversations" :key="conversation.id">
        <RouterLink
          :to="{ name: 'conversation', params: { id: conversation.id } }"
          class="flex min-h-9 items-center gap-2 rounded-md px-3 text-body text-ink-muted transition-colors duration-150 ease-default hover:bg-surface hover:text-ink"
          exact-active-class="bg-surface text-ink shadow-sm"
          data-test="history-item"
        >
          <span class="min-w-0 grow truncate">{{ conversation.title ?? 'New conversation' }}</span>
          <template v-if="conversation.is_saved">
            <BaseIcon name="check" :size="16" class="text-sprout-ink" />
            <span class="sr-only">(saved)</span>
          </template>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
