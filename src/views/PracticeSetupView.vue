<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'
import TextLink from '@/components/TextLink.vue'
import ResumeSession from '@/components/dashboard/ResumeSession.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AmountPicker from '@/components/practice/AmountPicker.vue'
import ModePicker from '@/components/practice/ModePicker.vue'
import ScopePicker from '@/components/practice/ScopePicker.vue'
import SessionSummary from '@/components/practice/SessionSummary.vue'
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

// One question at a time. Only flashcards and the quiz have an amount to pick, so the last step
// comes and goes with them.
const steps = computed<WizardStep[]>(() => {
  const all: WizardStep[] = [
    { id: 'how', label: 'How', title: 'How do you want to practise?', summary: modesSummary.value },
    {
      id: 'what',
      label: 'What',
      title: 'What do you want to practise?',
      summary: setup.summary.value.scopeLabel,
    },
  ]
  if (setup.hasSizedMode.value) {
    all.push({ id: 'amount', label: 'How much', title: 'How much?', summary: '' })
  }

  return all
})

// The amount step can't vanish while you're on it (you change modes in the first step), but if
// it ever does, stay on the last step that's left rather than on nothing.
watch(steps, (current) => {
  if (!current.some((step) => step.id === stepId.value)) {
    stepId.value = 'what'
  }
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

    <div v-else class="flex w-full max-w-280 flex-col gap-6 lg:flex-row lg:items-start">
      <div class="flex min-w-0 grow flex-col gap-5">
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

        <SetupWizard v-model="stepId" :steps="steps">
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
              v-model:card-amount="cardAmount"
              v-model:question-amount="questionAmount"
              v-model:due-first="dueFirst"
              v-model:interleave="interleave"
              :modes="modes"
              :available="available"
              :whole-topic="scope?.subtopic === null"
            />
          </template>
        </SetupWizard>
      </div>

      <div class="flex flex-col gap-3 lg:w-90 lg:flex-none">
        <template v-if="setup.materialState.value === 'failed'">
          <FormError :message="setup.materialError.value" />
          <BaseButton variant="secondary" icon="rotate-ccw" @click="setup.loadMaterial">
            Try again
          </BaseButton>
        </template>
        <FormError v-if="setup.startError.value" :message="setup.startError.value" />
        <SessionSummary
          :blocks="setup.summary.value.blocks"
          :scope="setup.summary.value.scopeLabel"
          :order="setup.summary.value.orderLabel"
          :loading="setup.materialState.value === 'loading'"
          :second-try="setup.secondTry.value"
          :no-modes="modes.length === 0"
          :starting="setup.starting.value"
          @start="setup.start"
        />
      </div>
    </div>
  </AppLayout>
</template>
