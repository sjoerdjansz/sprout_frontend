<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { MessageFile } from '@/components/chat/ChatMessage.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import PracticeModes from '@/components/dashboard/PracticeModes.vue'
import RetentionQueue, { type QueueState } from '@/components/dashboard/RetentionQueue.vue'
import TutorPrompt, { type LastSession } from '@/components/dashboard/TutorPrompt.vue'
import { useComposerAttachments } from '@/composables/chat/useComposerAttachments'
import { ApiError } from '@/lib/api'
import { masteredTopicCount, retentionQueue, reviewMinutes, type QueueTopic } from '@/lib/dashboard'
import { dayOverline, greeting } from '@/lib/greeting'
import { firstName, initials } from '@/lib/names'
import { relativeTime } from '@/lib/relativeTime'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'
import { useTopicsStore } from '@/stores/topics'

const auth = useAuthStore()
const conversationsStore = useConversationsStore()
const topicsStore = useTopicsStore()
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

// --- Your library: the mastered badge and today's retention queue

const queueState = ref<QueueState>('loading')
const queueError = ref('')

async function loadTopics(): Promise<void> {
  queueState.value = 'loading'

  try {
    await topicsStore.fetchTopics()
    queueState.value = 'loaded'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    queueError.value = caught.message
    queueState.value = 'failed'
  }
}

onMounted(loadTopics)

const masteredTopics = computed<number | null>(() =>
  queueState.value === 'loaded' ? masteredTopicCount(topicsStore.topics) : null,
)

const queue = computed<QueueTopic[]>(() => retentionQueue(topicsStore.topics))

// The queue shows the four most urgent topics; the badge counts every due card.
const shownQueue = computed<QueueTopic[]>(() => queue.value.slice(0, 4))

const dueCount = computed<number>(() =>
  queue.value.reduce((sum, topic) => sum + topic.cardCount, 0),
)

// A practice session covers one topic, so Start review takes the most urgent one.
const firstInQueue = computed<QueueTopic | null>(() => queue.value[0] ?? null)

function startReview(): void {
  if (firstInQueue.value === null) {
    return
  }
  void router.push({
    name: 'practice',
    query: { topic: firstInQueue.value.topicId, modes: 'cards' },
  })
}

// --- Starting a conversation with the tutor

const message = ref('')
const pendingMessage = ref<string | null>(null)
const pendingFiles = ref<MessageFile[]>([])
const error = ref<string | null>(null)
const attachments = useComposerAttachments()
const { attachments: attachedFiles, notice: attachmentNotice } = attachments

async function startConversation(text: string): Promise<void> {
  const materialIds = attachments.readyIds.value
  const sentFiles = attachments.takeForSending()
  pendingMessage.value = text
  pendingFiles.value = sentFiles.map((file) => ({
    original_filename: file.name,
    size_bytes: file.sizeBytes,
  }))
  message.value = ''
  error.value = null

  try {
    // The files go with the first message of the new conversation.
    const conversation = await conversationsStore.startConversation(text, { materialIds })
    await router.push({ name: 'conversation', params: { id: conversation.id } })
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    // Nothing was stored, so give your text and files back to send again (same ids, no upload).
    message.value = text
    error.value = attachments.restore(sentFiles, caught)
  } finally {
    pendingMessage.value = null
    pendingFiles.value = []
  }
}
</script>

<template>
  <AppLayout>
    <DashboardHeader
      :overline="dayOverline(now)"
      :title="title"
      :mastered-topics="masteredTopics"
      :total-topics="topicsStore.topics.length"
    />

    <div class="flex flex-wrap items-stretch gap-6">
      <TutorPrompt
        v-model="message"
        :pending-message="pendingMessage"
        :pending-files="pendingFiles"
        :attachments="attachedFiles"
        :attachment-notice="attachmentNotice"
        :error="error"
        :last-session="lastSession"
        :user-initials="initials(auth.user?.name ?? '')"
        class="min-w-0 flex-[2_1_520px]"
        @send="startConversation"
        @attach="attachments.add"
        @remove-attachment="attachments.remove"
      />
      <RetentionQueue
        :state="queueState"
        :error="queueError"
        :topics="shownQueue"
        :due-count="dueCount"
        :minutes="reviewMinutes(firstInQueue?.cardCount ?? 0)"
        :library-is-empty="topicsStore.topics.length === 0"
        class="min-w-0 flex-[1_1_320px]"
        @start="startReview"
        @retry="loadTopics"
      />
    </div>

    <PracticeModes />
  </AppLayout>
</template>
