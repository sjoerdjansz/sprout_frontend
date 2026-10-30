<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import type { SelectOption } from '@/components/BaseSelect.vue'
import BaseTabs, { type TabItem } from '@/components/BaseTabs.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import type { TopicFormValues } from '@/components/knowledgeMap/TopicForm.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import DeleteSubtopicDialog from '@/components/subtopic/DeleteSubtopicDialog.vue'
import EditSubtopicDialog from '@/components/subtopic/EditSubtopicDialog.vue'
import FlashcardsPanel, { type CardEditorTarget } from '@/components/subtopic/FlashcardsPanel.vue'
import QuestionsPanel from '@/components/subtopic/QuestionsPanel.vue'
import SessionsPanel from '@/components/subtopic/SessionsPanel.vue'
import SourcesPanel from '@/components/subtopic/SourcesPanel.vue'
import SubtopicHeader from '@/components/subtopic/SubtopicHeader.vue'
import { useToast } from '@/composables/useToast'
import { useUndoableDelete } from '@/composables/useUndoableDelete'
import { ApiError } from '@/lib/api'
import { describeAdded } from '@/lib/knowledgeMap'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore, type ConversationListItem } from '@/stores/conversations'
import { useFlashcardsStore, type Flashcard, type FlashcardInput } from '@/stores/flashcards'
import { useQuestionsStore, type Question } from '@/stores/questions'
import { useTopicsStore, type AddedMaterial, type SubtopicDetail } from '@/stores/topics'
import NotFoundView from '@/views/NotFoundView.vue'

const { id } = defineProps<{
  id: number
}>()

const router = useRouter()
const auth = useAuthStore()
const topicsStore = useTopicsStore()
const flashcardsStore = useFlashcardsStore()
const questionsStore = useQuestionsStore()
const conversationsStore = useConversationsStore()
const { toast, showToast } = useToast()
const { pending, isHidden, schedule, undo, flush } = useUndoableDelete(failAction)

type LoadState = 'loading' | 'loaded' | 'not-found' | 'failed'

const loadState = ref<LoadState>('loading')
const loadError = ref('')
/** Why the last action on the page (pause, generate, delete …) didn't work. */
const actionError = ref<string | null>(null)

// Only the subtopic this page is about, never the one from the page before.
const subtopic = computed<SubtopicDetail | null>(() =>
  topicsStore.subtopic?.id === id ? topicsStore.subtopic : null,
)

const userInitials = computed<string>(() => initials(auth.user?.name ?? ''))

// What's waiting to be deleted is hidden straight away, so you see the result of your click.
const cards = computed<Flashcard[]>(() =>
  flashcardsStore.flashcards.filter((card) => !isHidden(`card-${card.id}`)),
)
const questions = computed<Question[]>(() =>
  questionsStore.questions.filter((question) => !isHidden(`question-${question.id}`)),
)
const sessions = computed<ConversationListItem[]>(() =>
  conversationsStore.topicConversations.filter((session) => !isHidden(`session-${session.id}`)),
)
const notes = computed<string | null>(() =>
  subtopic.value?.notes && !isHidden('notes') ? subtopic.value.notes : null,
)

type TabId = 'cards' | 'questions' | 'sessions' | 'sources'

const tab = ref<TabId>('cards')

const tabs = computed<TabItem<TabId>[]>(() => [
  { id: 'cards', label: 'Flashcards', icon: 'layers', count: cards.value.length },
  { id: 'questions', label: 'Questions', icon: 'list-checks', count: questions.value.length },
  { id: 'sessions', label: 'Sessions', icon: 'message-circle', count: sessions.value.length },
  { id: 'sources', label: 'Sources', icon: 'book-open', count: notes.value === null ? 0 : 1 },
])

const tabLabel = computed<string>(
  () => tabs.value.find((candidate) => candidate.id === tab.value)?.label ?? '',
)

/** Loads the subtopic, then its cards, questions and its topic's sessions. */
async function loadAll(showLoading: boolean): Promise<void> {
  if (showLoading) {
    loadState.value = 'loading'
  }

  try {
    const loaded = await topicsStore.fetchSubtopic(id)
    await Promise.all([
      flashcardsStore.fetchFlashcards(id),
      questionsStore.fetchQuestions(id),
      conversationsStore.fetchTopicConversations(loaded.topic.id),
    ])
    loadState.value = 'loaded'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    if (caught.status === 404) {
      loadState.value = 'not-found'
    } else if (showLoading) {
      loadError.value = caught.message
      loadState.value = 'failed'
    } else {
      actionError.value = caught.message
    }
  }
}

/**
 * Shows why an action failed. A 404 can mean the subtopic was deleted elsewhere (then the page
 * becomes the not found page) or only the card or question was: reloading tells which.
 */
function failAction(caught: unknown): void {
  if (!(caught instanceof ApiError)) {
    throw caught
  }
  if (caught.status === 404) {
    void loadAll(false)

    return
  }

  actionError.value = caught.fieldError('notes') ?? caught.fieldError('ai_key') ?? caught.message
}

// Cards and answers feed the header's mastery, facets and due count, so fetch it after a change.
async function refreshHeader(): Promise<void> {
  try {
    await topicsStore.fetchSubtopic(id)
  } catch (caught) {
    failAction(caught)
  }
}

// --- Flashcards

const cardEditor = ref<CardEditorTarget | null>(null)
const savingCard = ref(false)
const cardError = ref<ApiError | null>(null)

function openCardEditor(target: CardEditorTarget): void {
  cardError.value = null
  cardEditor.value = target
}

async function saveCard(input: FlashcardInput): Promise<void> {
  const target = cardEditor.value
  if (target === null) {
    return
  }
  savingCard.value = true
  cardError.value = null

  try {
    if (target === 'new') {
      await flashcardsStore.addFlashcard(id, input)
    } else {
      await flashcardsStore.editFlashcard(target, input)
    }
    cardEditor.value = null
    void refreshHeader()
  } catch (caught) {
    if (caught instanceof ApiError && caught.status !== 404) {
      // Nothing was saved; the editor keeps your text so you can fix it.
      cardError.value = caught
    } else {
      cardEditor.value = null
      failAction(caught)
    }
  } finally {
    savingCard.value = false
  }
}

async function togglePause(card: Flashcard): Promise<void> {
  actionError.value = null

  try {
    await flashcardsStore.setPaused(card.id, !card.paused)
    void refreshHeader()
  } catch (caught) {
    failAction(caught)
  }
}

// --- Deleting, with a few seconds to undo it

function removeCard(card: Flashcard): void {
  schedule({
    key: `card-${card.id}`,
    title: 'Card deleted',
    run: async () => {
      await flashcardsStore.deleteFlashcard(card.id)
      await refreshHeader()
    },
  })
}

function removeQuestion(question: Question): void {
  schedule({
    key: `question-${question.id}`,
    title: 'Question deleted',
    run: async () => {
      await questionsStore.deleteQuestion(question.id)
      await refreshHeader()
    },
  })
}

function removeSession(session: ConversationListItem): void {
  schedule({
    key: `session-${session.id}`,
    title: 'Session deleted',
    run: () => conversationsStore.deleteConversation(session.id),
  })
}

// Removing the only source clears the notes; the cards and questions made from them stay.
function removeNotes(): void {
  const current = subtopic.value
  if (current === null) {
    return
  }

  schedule({
    key: 'notes',
    title: 'Source removed',
    run: async () => {
      await topicsStore.updateSubtopic(id, {
        topicId: current.topic.id,
        title: current.title,
        description: current.description ?? '',
        notes: '',
      })
      await refreshHeader()
    },
  })
}

// --- Generating from the notes

const generating = ref(false)

function announceAdded(added: AddedMaterial): void {
  showToast(
    added.flashcards + added.questions === 0
      ? {
          title: 'Nothing new to add',
          message: 'Your notes are already covered.',
          tone: 'sprout',
          icon: 'check',
        }
      : { title: `Added ${describeAdded(added)}`, tone: 'sprout', icon: 'sparkles' },
  )
}

async function generate(): Promise<void> {
  actionError.value = null
  generating.value = true

  try {
    const result = await topicsStore.generateMaterial(id)
    await Promise.all([
      flashcardsStore.fetchFlashcards(id),
      questionsStore.fetchQuestions(id),
      topicsStore.fetchSubtopic(id),
    ])
    announceAdded(result.added)
  } catch (caught) {
    failAction(caught)
  } finally {
    generating.value = false
  }
}

// --- Editing the subtopic (name, main topic, description and notes)

const isEditOpen = ref(false)
const savingEdit = ref(false)
const editError = ref<ApiError | null>(null)

const topicOptions = computed<SelectOption[]>(() =>
  topicsStore.topics.map((topic) => ({ value: String(topic.id), label: topic.title })),
)

async function openEdit(): Promise<void> {
  actionError.value = null
  editError.value = null

  // The form lets you move the subtopic, so it needs your topics.
  if (topicsStore.topics.length === 0) {
    try {
      await topicsStore.fetchLibrary()
    } catch (caught) {
      failAction(caught)

      return
    }
  }
  isEditOpen.value = true
}

async function saveEdit(values: TopicFormValues): Promise<void> {
  savingEdit.value = true
  editError.value = null

  try {
    const result = await topicsStore.updateSubtopic(id, {
      topicId: values.topicId,
      title: values.title,
      description: values.description,
      notes: values.notes,
    })
    isEditOpen.value = false
    if (result.added.flashcards + result.added.questions > 0) {
      announceAdded(result.added)
    }
    // New notes can add material, and a new main topic brings other sessions.
    await loadAll(false)
  } catch (caught) {
    if (caught instanceof ApiError && caught.status !== 404) {
      // Nothing was saved; the form keeps your values so you can fix them and try again.
      editError.value = caught
    } else {
      isEditOpen.value = false
      failAction(caught)
    }
  } finally {
    savingEdit.value = false
  }
}

// --- Deleting the subtopic

const isDeleteOpen = ref(false)
const deletingSubtopic = ref(false)
const deleteError = ref<string | null>(null)

function openDelete(): void {
  deleteError.value = null
  isDeleteOpen.value = true
}

async function confirmDelete(): Promise<void> {
  // Whatever waits to be deleted goes with the subtopic anyway.
  undo()
  deletingSubtopic.value = true
  deleteError.value = null

  try {
    await topicsStore.deleteSubtopic(id)
    await router.push({ name: 'knowledge-map' })
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    // Already gone (deleted elsewhere): the knowledge map is where you'd end up anyway.
    if (caught.status === 404) {
      await router.push({ name: 'knowledge-map' })

      return
    }
    deleteError.value = caught.message
  } finally {
    deletingSubtopic.value = false
  }
}

// Opening another subtopic reuses this page, so start fresh (and send what's waiting first).
watch(
  () => id,
  () => {
    flush()
    tab.value = 'cards'
    actionError.value = null
    cardEditor.value = null
    void loadAll(true)
  },
  { immediate: true },
)

watch(tab, () => {
  actionError.value = null
  cardEditor.value = null
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
      <BaseButton variant="secondary" icon="rotate-ccw" data-test="retry" @click="loadAll(true)">
        Try again
      </BaseButton>
    </div>

    <div v-else-if="subtopic !== null" class="flex flex-col gap-3.5">
      <SubtopicHeader :subtopic="subtopic" @edit="openEdit" @delete="openDelete" />

      <BaseTabs v-model="tab" :items="tabs" label="Materials" class="self-start" />

      <FormError v-if="actionError" :message="actionError" />

      <section
        role="tabpanel"
        :aria-label="tabLabel"
        class="overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
      >
        <FlashcardsPanel
          v-if="tab === 'cards'"
          :cards="cards"
          :editing="cardEditor"
          :saving="savingCard"
          :editor-error="cardError"
          :generating="generating"
          @add="openCardEditor('new')"
          @edit="(card) => openCardEditor(card.id)"
          @cancel-edit="cardEditor = null"
          @save="saveCard"
          @toggle-pause="togglePause"
          @remove="removeCard"
          @generate="generate"
        />
        <QuestionsPanel
          v-else-if="tab === 'questions'"
          :questions="questions"
          @remove="removeQuestion"
        />
        <SessionsPanel
          v-else-if="tab === 'sessions'"
          :sessions="sessions"
          :topic-title="subtopic.topic.title"
          :user-initials="userInitials"
          @remove="removeSession"
        />
        <SourcesPanel
          v-else
          :notes="notes"
          :generated-cards="cards.filter((card) => card.origin === 'ai').length"
          :generated-questions="questions.filter((question) => question.origin === 'ai').length"
          :generating="generating"
          @edit="openEdit"
          @generate="generate"
          @remove="removeNotes"
        />
      </section>

      <EditSubtopicDialog
        v-if="isEditOpen"
        :subtopic="subtopic"
        :topic-options="topicOptions"
        :saving="savingEdit"
        :error="editError"
        @save="saveEdit"
        @close="isEditOpen = false"
      />

      <DeleteSubtopicDialog
        v-if="isDeleteOpen"
        :title="subtopic.title"
        :deleting="deletingSubtopic"
        :error="deleteError"
        @confirm="confirmDelete"
        @close="isDeleteOpen = false"
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
