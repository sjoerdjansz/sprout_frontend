<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import MaterialToolbar from '@/components/subtopic/MaterialToolbar.vue'
import SessionRow from '@/components/subtopic/SessionRow.vue'
import { filterSessions } from '@/lib/subtopicPage'
import type { ConversationListItem } from '@/stores/conversations'

const { sessions, topicTitle, userInitials } = defineProps<{
  sessions: ConversationListItem[]
  /** Sessions belong to the whole topic, not to one subtopic. */
  topicTitle: string
  userInitials: string
}>()

const emit = defineEmits<{
  remove: [session: ConversationListItem]
}>()

const query = ref('')
const expandedId = ref<number | null>(null)

const shownSessions = computed<ConversationListItem[]>(() => filterSessions(sessions, query.value))

function toggle(sessionId: number): void {
  expandedId.value = expandedId.value === sessionId ? null : sessionId
}
</script>

<template>
  <!-- No filter chips: a conversation doesn't record which techniques it used. -->
  <MaterialToolbar v-model:query="query" search-label="Search sessions">
    <!-- No practice sessions yet (see ../specs/subtopic-page.md). -->
    <BaseButton size="sm" icon="message-circle" disabled title="Coming soon">
      New session
    </BaseButton>
  </MaterialToolbar>

  <p class="px-5 pt-3 text-caption font-normal text-ink-subtle" data-test="sessions-scope">
    Your conversations with the tutor about {{ topicTitle }}, the whole topic.
  </p>

  <ul class="flex flex-col gap-0.5 p-2">
    <SessionRow
      v-for="session in shownSessions"
      :key="session.id"
      :session="session"
      :expanded="expandedId === session.id"
      :user-initials="userInitials"
      @toggle="toggle(session.id)"
      @remove="emit('remove', session)"
    />
    <li
      v-if="shownSessions.length === 0"
      class="px-4 py-8 text-center text-[14px] text-ink-muted"
      data-test="empty"
    >
      {{
        sessions.length === 0
          ? 'No sessions yet. Start one and it shows up here.'
          : 'No sessions match your search.'
      }}
    </li>
  </ul>
</template>
