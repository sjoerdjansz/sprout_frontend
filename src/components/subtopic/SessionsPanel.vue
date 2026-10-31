<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import MaterialToolbar from '@/components/subtopic/MaterialToolbar.vue'
import SessionRow from '@/components/subtopic/SessionRow.vue'
import { filterSessions } from '@/lib/subtopicPage'
import type { PracticeSession } from '@/stores/practice'

const { sessions, subtopicId, subtopicTitle, userInitials } = defineProps<{
  /** Practice sessions in which this subtopic was practised, latest first. */
  sessions: PracticeSession[]
  subtopicId: number
  subtopicTitle: string
  userInitials: string
}>()

const emit = defineEmits<{
  start: []
}>()

const query = ref('')
const expandedId = ref<number | null>(null)

const shownSessions = computed<PracticeSession[]>(() => filterSessions(sessions, query.value))

function toggle(sessionId: number): void {
  expandedId.value = expandedId.value === sessionId ? null : sessionId
}
</script>

<template>
  <MaterialToolbar v-model:query="query" search-label="Search sessions">
    <BaseButton size="sm" icon="message-circle" data-test="new-session" @click="emit('start')">
      New session
    </BaseButton>
  </MaterialToolbar>

  <p class="px-5 pt-3 text-caption font-normal text-ink-subtle" data-test="sessions-scope">
    Your practice sessions with {{ subtopicTitle }}, also the ones on its whole topic.
  </p>

  <ul class="flex flex-col gap-0.5 p-2">
    <SessionRow
      v-for="session in shownSessions"
      :key="session.id"
      :session="session"
      :subtopic-id="subtopicId"
      :expanded="expandedId === session.id"
      :user-initials="userInitials"
      @toggle="toggle(session.id)"
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
