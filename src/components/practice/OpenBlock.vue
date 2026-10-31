<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'
import ChatComposer, { type Suggestion } from '@/components/chat/ChatComposer.vue'
import ChatThread from '@/components/chat/ChatThread.vue'
import { ApiError } from '@/lib/api'
import { chatErrorMessage } from '@/lib/chatError'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore, type Message } from '@/stores/conversations'

const { topicId, topicTitle, subtopicTitle } = defineProps<{
  topicId: number
  topicTitle: string
  /** The subtopic you picked; null for the whole topic. */
  subtopicTitle: string | null
}>()

const emit = defineEmits<{
  sent: []
  finish: []
}>()

const auth = useAuthStore()
const conversationsStore = useConversationsStore()

// The conversation this block started; the store's open conversation could be another one.
const conversationId = ref<number | null>(null)
const message = ref('')
const pendingMessage = ref<string | null>(null)
const sendError = ref<string | null>(null)

const subject = computed<string>(() => subtopicTitle ?? topicTitle)

const messages = computed<Message[]>(() =>
  conversationsStore.conversation !== null &&
  conversationsStore.conversation.id === conversationId.value
    ? conversationsStore.conversation.messages
    : [],
)

const suggestions = computed<Suggestion[]>(() => [
  {
    label: `Quiz me on ${subject.value}`,
    icon: 'list-checks',
    message: `Quiz me on ${subject.value}. Ask me one question at a time.`,
  },
  {
    label: 'Ask what I remember',
    icon: 'brain',
    message: `Ask me what I remember about ${subject.value}, then help me fill the gaps.`,
  },
  {
    label: 'Go deeper',
    icon: 'sparkles',
    message: `I know the basics of ${subject.value}. Take me one step further.`,
  },
])

const bottom = useTemplateRef<HTMLElement>('bottom')

async function scrollToNewest(): Promise<void> {
  await nextTick()
  bottom.value?.scrollIntoView({ block: 'end', behavior: 'smooth' })
}

// The first message starts a conversation about the topic ("Continue learning"); the rest
// go to that conversation.
async function send(text: string): Promise<void> {
  pendingMessage.value = text
  message.value = ''
  sendError.value = null
  void scrollToNewest()

  try {
    if (conversationId.value === null) {
      const started = await conversationsStore.startConversation(text, topicId)
      conversationId.value = started.id
    } else {
      await conversationsStore.sendMessage(conversationId.value, text)
    }
    emit('sent')
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    // Nothing was stored, so give your text back to send again.
    message.value = text
    sendError.value = chatErrorMessage(caught)
  } finally {
    pendingMessage.value = null
    void scrollToNewest()
  }
}

// The practice pages have no sidebar to load you, and the chat shows your initials.
onMounted(async () => {
  if (auth.user !== null) {
    return
  }
  try {
    await auth.fetchUser()
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
  }
})
</script>

<template>
  <main class="flex grow flex-col px-4 sm:px-8" data-test="open-block">
    <div class="mx-auto flex w-full max-w-190 grow flex-col gap-5 py-6">
      <p
        class="self-center rounded-full bg-surface-tint px-3.5 py-2 text-center text-caption font-semibold text-sprout-ink"
      >
        Talk {{ subject }} through with the tutor. It asks before it tells. This chat also goes in
        your chat history.
      </p>

      <ChatThread
        :messages="messages"
        :pending-message="pendingMessage"
        :user-initials="initials(auth.user?.name ?? '')"
        class="grow"
      />

      <div ref="bottom" class="sticky bottom-0 flex flex-col gap-3 bg-canvas pt-2 pb-4">
        <FormError v-if="sendError" :message="sendError" />
        <ChatComposer
          v-model="message"
          :suggestions="messages.length === 0 ? suggestions : []"
          :disabled="pendingMessage !== null"
          placeholder="Answer, or ask the tutor to go deeper…"
          @send="send"
        />
      </div>
    </div>
  </main>

  <footer
    class="flex flex-none items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 text-caption font-normal text-ink-subtle sm:px-8"
  >
    <span>An open session doesn’t change your mastery directly.</span>
    <BaseButton variant="secondary" size="sm" data-test="wrap-up" @click="emit('finish')">
      Wrap up
    </BaseButton>
  </footer>
</template>
