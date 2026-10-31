<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseTabs, { type TabItem } from '@/components/BaseTabs.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import TopicFormDialog from '@/components/knowledgeMap/TopicFormDialog.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import DeleteSubtopicDialog from '@/components/subtopic/DeleteSubtopicDialog.vue'
import FlashcardsPanel from '@/components/subtopic/FlashcardsPanel.vue'
import GenerationNotice from '@/components/subtopic/GenerationNotice.vue'
import QuestionsPanel from '@/components/subtopic/QuestionsPanel.vue'
import SessionsPanel from '@/components/subtopic/SessionsPanel.vue'
import SourcesPanel from '@/components/subtopic/SourcesPanel.vue'
import SubtopicHeader from '@/components/subtopic/SubtopicHeader.vue'
import { useDeleteSubtopic } from '@/composables/subtopic/useDeleteSubtopic'
import { useEditSubtopic } from '@/composables/subtopic/useEditSubtopic'
import { useFlashcardEditor } from '@/composables/subtopic/useFlashcardEditor'
import { useGenerateMaterial } from '@/composables/subtopic/useGenerateMaterial'
import { useSubtopicLoader } from '@/composables/subtopic/useSubtopicLoader'
import { useSubtopicMaterial } from '@/composables/subtopic/useSubtopicMaterial'
import { useToast } from '@/composables/useToast'
import { initials } from '@/lib/names'
import type { PracticeModeId } from '@/lib/practiceModes'
import { useAuthStore } from '@/stores/auth'
import NotFoundView from '@/views/NotFoundView.vue'

const { id } = defineProps<{
  id: number
}>()

const auth = useAuthStore()
const router = useRouter()
const { toast, showToast } = useToast()

const { loadState, loadError, actionError, subtopic, load, actions } = useSubtopicLoader(() => id)
const {
  cards,
  questions,
  sessions,
  notes,
  pending,
  undo,
  flush,
  removeCard,
  removeQuestion,
  removeNotes,
} = useSubtopicMaterial(subtopic, actions)
const cardEditor = useFlashcardEditor(actions)
const {
  status: generationStatus,
  generating,
  checkError,
  generate,
} = useGenerateMaterial(subtopic, actions, showToast)
const edit = useEditSubtopic(subtopic, actions)
const deletion = useDeleteSubtopic(() => id, undo)

// The editor's and dialogs' refs, top-level so the template unwraps them.
const { editing: editingCard, saving: savingCard, error: cardError } = cardEditor
const {
  isOpen: isEditOpen,
  saving: savingEdit,
  error: editError,
  initialValues: editValues,
  topicOptions,
} = edit
const { isOpen: isDeleteOpen, deleting: deletingSubtopic, error: deleteError } = deletion

// "Generate from sources" needs something to generate from.
const hasSources = computed<boolean>(() => (subtopic.value?.source_count ?? 0) > 0)

const userInitials = computed<string>(() => initials(auth.user?.name ?? ''))

type TabId = 'cards' | 'questions' | 'sessions' | 'sources'

const tab = ref<TabId>('cards')

const tabs = computed<TabItem<TabId>[]>(() => [
  { id: 'cards', label: 'Flashcards', icon: 'layers', count: cards.value.length },
  { id: 'questions', label: 'Questions', icon: 'list-checks', count: questions.value.length },
  { id: 'sessions', label: 'Sessions', icon: 'message-circle', count: sessions.value.length },
  { id: 'sources', label: 'Sources', icon: 'book-open', count: subtopic.value?.source_count ?? 0 },
])

const tabLabel = computed<string>(
  () => tabs.value.find((candidate) => candidate.id === tab.value)?.label ?? '',
)

// Opening another subtopic reuses this page, so start fresh (and send what's waiting first).
watch(
  () => id,
  () => {
    flush()
    tab.value = 'cards'
    actions.clearActionError()
    cardEditor.close()
    void load()
  },
  { immediate: true },
)

// The practice setup, prefilled with this subtopic (and a mode, from Quiz me now or New session).
function practise(mode?: PracticeModeId): void {
  const query: Record<string, string> = { subtopic: String(id) }
  if (mode !== undefined) {
    query.modes = mode
  }
  void router.push({ name: 'practice', query })
}

watch(tab, () => {
  actions.clearActionError()
  cardEditor.close()
})
</script>

<template>
  <!-- In place, so the URL you opened stays (see ../specs/not-found.md). -->
  <NotFoundView v-if="loadState === 'not-found'" />

  <AppLayout v-else>
    <p v-if="loadState === 'loading'" class="text-ink-muted" aria-live="polite">
      Loading your subtopic…
    </p>

    <div v-else-if="loadState === 'failed'" class="flex flex-col items-start gap-4">
      <FormError :message="loadError" />
      <BaseButton variant="secondary" icon="rotate-ccw" data-test="retry" @click="load">
        Try again
      </BaseButton>
    </div>

    <div v-else-if="subtopic !== null" class="flex flex-col gap-3.5">
      <SubtopicHeader
        :subtopic="subtopic"
        @practice="practise()"
        @edit="edit.open"
        @delete="deletion.open"
      />

      <BaseTabs v-model="tab" :items="tabs" label="Materials" class="self-start" />

      <FormError v-if="actionError" :message="actionError" />

      <section
        role="tabpanel"
        :aria-label="tabLabel"
        class="overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
      >
        <!-- Where the new material lands; sessions aren't made from the notes. -->
        <GenerationNotice
          v-if="generationStatus !== null && tab !== 'sessions'"
          :status="generationStatus"
          :check-error="checkError"
          @retry="generate"
        />
        <FlashcardsPanel
          v-if="tab === 'cards'"
          :cards="cards"
          :editing="editingCard"
          :saving="savingCard"
          :editor-error="cardError"
          :generating="generating"
          :has-sources="hasSources"
          @add="cardEditor.open('new')"
          @edit="(card) => cardEditor.open(card.id)"
          @cancel-edit="cardEditor.close"
          @save="cardEditor.save"
          @toggle-pause="cardEditor.togglePause"
          @remove="removeCard"
          @generate="generate"
        />
        <QuestionsPanel
          v-else-if="tab === 'questions'"
          :questions="questions"
          :has-sources="hasSources"
          @remove="removeQuestion"
          @quiz="practise('retrieval')"
        />
        <SessionsPanel
          v-else-if="tab === 'sessions'"
          :sessions="sessions"
          :subtopic-id="subtopic.id"
          :subtopic-title="subtopic.title"
          :user-initials="userInitials"
          @start="practise('open')"
        />
        <SourcesPanel
          v-else
          :notes="notes"
          :generated-cards="cards.filter((card) => card.origin === 'ai').length"
          :generated-questions="questions.filter((question) => question.origin === 'ai').length"
          :generating="generating"
          @edit="edit.open"
          @generate="generate"
          @remove="removeNotes"
        />
      </section>

      <TopicFormDialog
        v-if="isEditOpen && editValues !== null"
        mode="edit-subtopic"
        :initial-values="editValues"
        :category-options="[]"
        :topic-options="topicOptions"
        :saving="savingEdit"
        :error="editError"
        @save="edit.save"
        @close="edit.close"
      />

      <DeleteSubtopicDialog
        v-if="isDeleteOpen"
        :title="subtopic.title"
        :deleting="deletingSubtopic"
        :error="deleteError"
        @confirm="deletion.confirm"
        @close="deletion.close"
      />
    </div>

    <!-- One toast at a time: a delete you can still undo comes first. -->
    <BaseToast
      v-if="pending !== null"
      :title="pending.title"
      message="You can still undo this."
      tone="ember"
      icon="trash-2"
    >
      <BaseButton size="sm" variant="ghost" data-test="undo" @click="undo">Undo</BaseButton>
    </BaseToast>
    <BaseToast
      v-else-if="toast !== null"
      :title="toast.title"
      :message="toast.message"
      :tone="toast.tone"
      :icon="toast.icon"
    />
  </AppLayout>
</template>
