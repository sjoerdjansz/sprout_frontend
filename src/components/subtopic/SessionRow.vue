<script setup lang="ts">
import { computed, useId } from 'vue'
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import ChatThread from '@/components/chat/ChatThread.vue'
import MaterialRow from '@/components/subtopic/MaterialRow.vue'
import { practiceMode } from '@/lib/practiceModes'
import { sessionMinutes } from '@/lib/practiceSession'
import { relativeTime } from '@/lib/relativeTime'
import { sessionActivity, sessionTitle } from '@/lib/subtopicPage'
import { capitalize } from '@/lib/text'
import type { PracticedSubtopic, PracticeSession } from '@/stores/practice'

const { session, subtopicId, expanded, userInitials } = defineProps<{
  session: PracticeSession
  /** The subtopic of the page, whose mastery change the row shows. */
  subtopicId: number
  expanded: boolean
  userInitials: string
}>()

const emit = defineEmits<{
  toggle: []
}>()

const previewId = useId()

// One way to practise shows its own icon; a mix shows the shuffle.
const look = computed<{ icon: IconName; tint: Tint }>(() => {
  const [only, ...others] = session.plan.modes
  if (only === undefined || others.length > 0) {
    return { icon: 'shuffle', tint: 'peach' }
  }
  const mode = practiceMode(only)

  return { icon: mode.icon, tint: mode.tint }
})

const thisSubtopic = computed<PracticedSubtopic | undefined>(() =>
  session.subtopics.find((subtopic) => subtopic.id === subtopicId),
)
const hasChat = computed<boolean>(() => session.done.messages.length > 0)
</script>

<template>
  <MaterialRow :icon="look.icon" :tint="look.tint" :highlighted="expanded" data-test="session">
    <div class="flex flex-col gap-1">
      <b class="text-[15px] leading-5 font-[650] text-ink">{{ sessionTitle(session) }}</b>
      <span class="text-label font-normal text-ink-muted">{{ sessionActivity(session) }}</span>
    </div>

    <div v-if="expanded" :id="previewId" class="mt-2.5 flex max-w-180 flex-col gap-3">
      <ChatThread :messages="session.done.messages" :user-initials="userInitials" />
    </div>

    <template #meta>
      <span class="text-label text-ink">
        {{ capitalize(relativeTime(session.last_activity_at)) }}
      </span>
      <span class="text-caption font-normal text-ink-subtle">
        {{ sessionMinutes(session) }} min · {{ session.xp_earned }} XP
      </span>
      <span
        v-if="thisSubtopic"
        class="text-caption font-normal text-ink-subtle"
        data-test="session-mastery"
      >
        Mastery {{ thisSubtopic.mastery_before }}% → {{ thisSubtopic.mastery_after }}%
      </span>
    </template>

    <template #actions>
      <BaseIconButton
        v-if="hasChat"
        :icon="expanded ? 'chevron-down' : 'chevron-right'"
        :label="expanded ? 'Hide the chat' : 'Show the chat'"
        :aria-expanded="expanded"
        :aria-controls="previewId"
        size="sm"
        data-test="toggle-session"
        @click="emit('toggle')"
      />
      <!-- Only today's session that's still going can be picked up again. -->
      <RouterLink
        v-if="!session.is_finished"
        :to="{ name: 'practice-session' }"
        class="inline-flex h-8.5 items-center gap-2 rounded-sm border border-line-strong bg-surface px-3 text-label text-ink shadow-xs transition duration-150 ease-default hover:bg-surface-sunken"
        data-test="continue-session"
      >
        Continue
        <BaseIcon name="arrow-right" :size="16" />
      </RouterLink>
    </template>
  </MaterialRow>
</template>
