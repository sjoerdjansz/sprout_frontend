<script setup lang="ts">
import { useId } from 'vue'
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import TextLink from '@/components/TextLink.vue'
import ChatThread from '@/components/chat/ChatThread.vue'
import MaterialRow from '@/components/subtopic/MaterialRow.vue'
import { pluralize } from '@/lib/knowledgeMap'
import { relativeTime } from '@/lib/relativeTime'
import { sessionMinutes, sessionSnippet } from '@/lib/subtopicPage'
import { capitalize } from '@/lib/text'
import type { ConversationListItem } from '@/stores/conversations'

const { session, expanded, userInitials } = defineProps<{
  session: ConversationListItem
  expanded: boolean
  userInitials: string
}>()

const emit = defineEmits<{
  toggle: []
  remove: []
}>()

const previewId = useId()
</script>

<template>
  <MaterialRow icon="message-circle" tint="mint" :highlighted="expanded" data-test="session">
    <button
      type="button"
      :aria-expanded="expanded"
      :aria-controls="previewId"
      class="flex cursor-pointer flex-col gap-1 rounded-sm text-left"
      data-test="toggle-session"
      @click="emit('toggle')"
    >
      <b class="text-[15px] leading-5 font-[650] text-ink">
        {{ session.title ?? 'New conversation' }}
      </b>
      <span class="line-clamp-2 text-label font-normal text-ink-muted">
        {{ sessionSnippet(session) }}
      </span>
    </button>

    <div v-if="expanded" :id="previewId" class="mt-2.5 flex max-w-180 flex-col gap-3">
      <ChatThread :messages="session.preview" :user-initials="userInitials" />
      <TextLink :to="{ name: 'conversation', params: { id: session.id } }" icon-right="arrow-right">
        Read the whole session
      </TextLink>
    </div>

    <template #meta>
      <span class="text-label text-ink">
        {{ capitalize(relativeTime(session.last_activity_at)) }}
      </span>
      <span class="text-caption font-normal text-ink-subtle">
        {{ sessionMinutes(session) }} min · {{ pluralize(session.message_count, 'message') }}
      </span>
    </template>

    <template #actions>
      <BaseIconButton
        :icon="expanded ? 'chevron-down' : 'chevron-right'"
        :label="expanded ? 'Collapse' : 'Preview session'"
        size="sm"
        @click="emit('toggle')"
      />
      <!-- A saved session opens read-only; "Continue learning" on its topic is still to build. -->
      <RouterLink
        :to="{ name: 'conversation', params: { id: session.id } }"
        class="inline-flex h-8.5 items-center gap-2 rounded-sm border border-line-strong bg-surface px-3 text-label text-ink shadow-xs transition duration-150 ease-default hover:bg-surface-sunken"
        data-test="continue-session"
      >
        Continue
        <BaseIcon name="arrow-right" :size="16" />
      </RouterLink>
      <BaseIconButton
        icon="trash-2"
        label="Delete session"
        size="sm"
        data-test="delete-session"
        @click="emit('remove')"
      />
    </template>
  </MaterialRow>
</template>
