<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'
import TextLink from '@/components/TextLink.vue'
import ChatComposer from '@/components/chat/ChatComposer.vue'
import ChatThread from '@/components/chat/ChatThread.vue'
import ConversationHeader from '@/components/conversation/ConversationHeader.vue'
import SaveTopicDialog from '@/components/conversation/SaveTopicDialog.vue'
import SavedNotice from '@/components/conversation/SavedNotice.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { ApiError } from '@/lib/api'
import { chatErrorMessage } from '@/lib/chatError'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'
import {
  useConversationsStore,
  type Conversation,
  type ReviewedDraft,
  type SaveResult,
} from '@/stores/conversations'

const { id } = defineProps<{
  id: number
}>()

const auth = useAuthStore()
const conversationsStore = useConversationsStore()

type LoadState = 'loading' | 'loaded' | 'not-found' | 'failed'

const loadState = ref<LoadState>('loading')
const loadError = ref('')

// Only the conversation this page is about, never the one from the page before.
const conversation = computed<Conversation | null>(() =>
  conversationsStore.conversation?.id === id ? conversationsStore.conversation : null,
)

const userInitials = computed<string>(() => initials(auth.user?.name ?? ''))

const message = ref('')
const pendingMessage = ref<string | null>(null)
const sendError = ref<string | null>(null)

const isSaveDialogOpen = ref(false)
const saving = ref(false)
const saveError = ref<ApiError | null>(null)
const saveResult = ref<SaveResult | null>(null)

const bottom = useTemplateRef<HTMLElement>('bottom')

async function scrollToNewest(): Promise<void> {
  await nextTick()
  bottom.value?.scrollIntoView({ block: 'end', behavior: 'smooth' })
}

async function load(): Promise<void> {
  loadState.value = 'loading'

  try {
    await conversationsStore.fetchConversation(id)
    loadState.value = 'loaded'
    void scrollToNewest()
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    loadState.value = caught.status === 404 ? 'not-found' : 'failed'
    loadError.value = caught.message
  }
}

// Opening another conversation from the history reuses this page, so start fresh.
watch(
  () => id,
  () => {
    message.value = ''
    sendError.value = null
    saveResult.value = null
    isSaveDialogOpen.value = false
    void load()
  },
  { immediate: true },
)

async function send(text: string): Promise<void> {
  pendingMessage.value = text
  message.value = ''
  sendError.value = null
  void scrollToNewest()

  try {
    await conversationsStore.sendMessage(id, text)
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

function openSaveDialog(): void {
  saveError.value = null
  isSaveDialogOpen.value = true
}

async function save(reviewedDraft: ReviewedDraft): Promise<void> {
  saving.value = true
  saveError.value = null

  try {
    saveResult.value = await conversationsStore.saveConversation(id, reviewedDraft)
    isSaveDialogOpen.value = false
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    // Nothing was saved; the dialog keeps your edits so you can fix them and try again.
    saveError.value = caught
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="mx-auto flex w-full max-w-190 grow flex-col gap-6">
      <p v-if="loadState === 'loading'" class="text-ink-muted" aria-live="polite">
        Loading your conversation…
      </p>

      <div v-else-if="loadState === 'not-found'" class="flex flex-col items-start gap-3">
        <h1 class="font-display text-title-lg text-ink">This conversation isn’t here</h1>
        <!-- Our own copy: the 404 is ours to explain, whatever the API's message says. -->
        <p class="text-ink-muted" data-test="not-found">
          We couldn’t find that conversation. Check the link, or head back to your dashboard.
        </p>
        <TextLink :to="{ name: 'home' }" icon-right="arrow-right">Back to your dashboard</TextLink>
      </div>

      <div v-else-if="loadState === 'failed'" class="flex flex-col items-start gap-4">
        <FormError :message="loadError" />
        <BaseButton variant="secondary" icon="rotate-ccw" data-test="retry" @click="load">
          Try again
        </BaseButton>
      </div>

      <template v-else-if="conversation">
        <ConversationHeader
          :title="conversation.title ?? 'New conversation'"
          :topic-title="conversation.topic?.title"
          :can-save="!conversation.is_saved"
          @save="openSaveDialog"
        />

        <ChatThread
          :messages="conversation.messages"
          :pending-message="pendingMessage"
          :user-initials="userInitials"
          class="grow"
        />

        <div ref="bottom" class="sticky bottom-0 flex flex-col gap-3 bg-canvas pt-2 pb-6">
          <SavedNotice v-if="conversation.is_saved" :result="saveResult" />

          <template v-else>
            <FormError v-if="sendError" :message="sendError" />
            <ChatComposer
              v-model="message"
              :disabled="pendingMessage !== null"
              placeholder="Answer the tutor, or ask something new…"
              @send="send"
            />
          </template>
        </div>

        <SaveTopicDialog
          v-if="isSaveDialogOpen"
          :draft="conversation.draft"
          :saving="saving"
          :error="saveError"
          @save="save"
          @close="isSaveDialogOpen = false"
        />
      </template>
    </div>
  </AppLayout>
</template>
