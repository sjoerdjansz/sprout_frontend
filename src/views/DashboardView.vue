<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import PracticeModes from '@/components/dashboard/PracticeModes.vue'
import RetentionQueue from '@/components/dashboard/RetentionQueue.vue'
import TutorPrompt, { type LastSession } from '@/components/dashboard/TutorPrompt.vue'
import WeeklyInsights from '@/components/dashboard/WeeklyInsights.vue'
import { ApiError } from '@/lib/api'
import { chatErrorMessage } from '@/lib/chatError'
import { dayOverline, greeting } from '@/lib/greeting'
import { firstName, initials } from '@/lib/names'
import { relativeTime } from '@/lib/relativeTime'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'
import { practiceModes, progress, retentionQueue, weeklyStats } from '@/views/dashboardPlaceholders'

const auth = useAuthStore()
const conversationsStore = useConversationsStore()
const router = useRouter()

const now = new Date()

const title = computed<string>(() => {
  const name = firstName(auth.user?.name ?? '')

  return name === '' ? greeting(now) : `${greeting(now)}, ${name}`
})

// The history itself is loaded by AppLayout, for the sidebar.
const lastSession = computed<LastSession | null>(() => {
  const lastOpenConversation = conversationsStore.conversations.find(
    (conversation) => !conversation.is_saved,
  )
  if (lastOpenConversation === undefined) {
    return null
  }

  return {
    title: lastOpenConversation.title ?? 'New conversation',
    lastStudied: relativeTime(lastOpenConversation.last_activity_at),
    to: { name: 'conversation', params: { id: lastOpenConversation.id } },
  }
})

const message = ref('')
const pendingMessage = ref<string | null>(null)
const error = ref<string | null>(null)

async function startConversation(text: string): Promise<void> {
  pendingMessage.value = text
  message.value = ''
  error.value = null

  try {
    const conversation = await conversationsStore.startConversation(text)
    await router.push({ name: 'conversation', params: { id: conversation.id } })
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    // Nothing was stored, so give your text back to send again.
    message.value = text
    error.value = chatErrorMessage(caught)
  } finally {
    pendingMessage.value = null
  }
}
</script>

<template>
  <AppLayout>
    <DashboardHeader
      :overline="dayOverline(now)"
      :title="title"
      :streak-days="progress.streakDays"
      :mastered-topics="progress.masteredTopics"
      :total-topics="progress.totalTopics"
    />

    <div class="flex flex-wrap items-stretch gap-6">
      <TutorPrompt
        v-model="message"
        :pending-message="pendingMessage"
        :error="error"
        :last-session="lastSession"
        :user-initials="initials(auth.user?.name ?? '')"
        class="min-w-0 flex-[2_1_520px]"
        @send="startConversation"
      />
      <RetentionQueue
        :topics="retentionQueue.topics"
        :due-count="retentionQueue.dueCount"
        :minutes="retentionQueue.minutes"
        class="min-w-0 flex-[1_1_320px]"
      />
    </div>

    <PracticeModes :modes="practiceModes" />

    <WeeklyInsights :stats="weeklyStats" />
  </AppLayout>
</template>
