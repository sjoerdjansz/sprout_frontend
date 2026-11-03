<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'
import TextLink from '@/components/TextLink.vue'
import ResumeSession from '@/components/dashboard/ResumeSession.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AmountPicker from '@/components/practice/AmountPicker.vue'
import ModePicker from '@/components/practice/ModePicker.vue'
import ScopePicker from '@/components/practice/ScopePicker.vue'
import SessionRecap from '@/components/practice/SessionRecap.vue'
import SetupWizard from '@/components/practice/SetupWizard.vue'
import type { WizardStep } from '@/components/practice/SetupStepper.vue'
import { usePracticeSetup } from '@/composables/practice/usePracticeSetup'
import { practiceMode } from '@/lib/practiceModes'
import { relativeTime } from '@/lib/relativeTime'

const setup = usePracticeSetup()
const {
  libraryState,
  topics,
  topicId,
  subtopicId,
  modes,
  cardAmount,
  questionAmount,
  available,
  dueFirst,
  interleave,
  scope,
  current,
} = setup

// "Photosynthesis" or "All subtopics from Biology": what the session you can pick up is about.
const currentTitle = computed<string>(() =>
  current.value === null
    ? ''
    : (current.value.subtopic?.title ?? `All subtopics from ${current.value.topic.title}`),
)

/** The wizard's step: 'how', 'what' or 'amount'. */
const stepId = ref<string>('how')

const modesSummary = computed<string>(() => {
  const [first, ...rest] = modes.value
  if (first === undefined) {
    return ''
  }

  return rest.length > 0 ? 'Mixed session' : practiceMode(first).name
})

// One question at a time, and always three, so Start session has one place: the last step, after
// a recap of the session. With only Explain it or the open session there's no amount to pick.
const steps = computed<WizardStep[]>(() => [
  { id: 'how', label: 'How', title: 'How do you want to practise?', summary: modesSummary.value },
  {
    id: 'what',
    label: 'What',
    title: 'What do you want to practise?',
    summary: setup.summary.value.scopeLabel,
  },
  setup.hasSizedMode.value
    ? { id: 'amount', label: 'How much', title: 'How much?', summary: '' }
    : { id: 'amount', label: 'Ready', title: 'Ready to start?', summary: '' },
])

const startLabel = computed<string>(() => {
  if (setup.materialState.value === 'loading') {
    return 'Getting your cards…'
  }

  return setup.starting.value ? 'Starting…' : 'Start session'
})

onMounted(() => {
  void setup.loadLibrary()
})
</script>

<template>
  <AppLayout>
    <h1 class="font-display text-title-lg text-ink">Set up a practice session</h1>

    <p v-if="libraryState === 'loading'" class="text-ink-muted" aria-live="polite">
      Loading your library…
    </p>

    <div v-else-if="libraryState === 'failed'" class="flex flex-col items-start gap-4">
      <FormError :message="setup.libraryError.value" />
      <BaseButton variant="secondary" icon="rotate-ccw" @click="setup.loadLibrary">
        Try again
      </BaseButton>
    </div>

    <div
      v-else-if="topics.length === 0"
      class="flex max-w-120 flex-col items-start gap-3"
      data-test="empty-library"
    >
      <h2 class="font-display text-title">Nothing to practise yet</h2>
      <p class="text-ink-muted">
        Practice runs on your topics. Start a chat with the tutor or add a topic yourself, then come
        back.
      </p>
      <TextLink :to="{ name: 'topics' }" icon-right="arrow-right"> Open your topics </TextLink>
    </div>

    <div v-else class="flex w-full max-w-200 flex-col gap-5">
      <div
        v-if="current"
        class="rounded-xl border border-line bg-surface px-5 py-4 shadow-sm"
        data-test="current-session"
      >
        <ResumeSession
          :title="currentTitle"
          :last-studied="`started ${relativeTime(current.started_at)}`"
          :to="{ name: 'practice-session' }"
          icon="play"
        />
      </div>

      <div v-if="setup.materialState.value === 'failed'" class="flex flex-col items-start gap-3">
        <FormError :message="setup.materialError.value" />
        <BaseButton variant="secondary" icon="rotate-ccw" @click="setup.loadMaterial">
          Try again
        </BaseButton>
      </div>

      <SetupWizard v-model="stepId" :steps="steps" :can-advance="modes.length > 0">
        <template #how>
          <ModePicker v-model="modes" :unavailable="setup.unavailable.value" />
        </template>

        <template #what>
          <ScopePicker
            v-model:topic-id="topicId"
            v-model:subtopic-id="subtopicId"
            :topics="topics"
            :show-whole-topic-tip="setup.showWholeTopicTip.value"
          />
        </template>

        <template #amount>
          <AmountPicker
            v-if="setup.hasSizedMode.value"
            v-model:card-amount="cardAmount"
            v-model:question-amount="questionAmount"
            v-model:due-first="dueFirst"
            v-model:interleave="interleave"
            :modes="modes"
            :available="available"
            :whole-topic="scope?.subtopic === null"
          />
          <!-- The footer under it draws the second line, so the recap sits between two. -->
          <hr v-if="setup.hasSizedMode.value" class="my-1 border-line" />
          <SessionRecap
            :blocks="setup.summary.value.blocks"
            :scope="setup.summary.value.scopeLabel"
            :order="setup.summary.value.orderLabel"
            :second-try="setup.secondTry.value"
          />
          <FormError v-if="setup.startError.value" :message="setup.startError.value" />
        </template>

        <template #finish>
          <BaseButton
            icon-right="arrow-right"
            :disabled="
              setup.materialState.value === 'loading' ||
              setup.starting.value ||
              setup.summary.value.blocks.length === 0
            "
            data-test="start-session"
            @click="setup.start"
          >
            {{ startLabel }}
          </BaseButton>
        </template>
      </SetupWizard>
    </div>
  </AppLayout>
</template>
