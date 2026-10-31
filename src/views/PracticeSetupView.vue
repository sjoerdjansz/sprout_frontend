<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'
import TextLink from '@/components/TextLink.vue'
import ResumeSession from '@/components/dashboard/ResumeSession.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AmountPicker from '@/components/practice/AmountPicker.vue'
import ModePicker from '@/components/practice/ModePicker.vue'
import ScopePicker from '@/components/practice/ScopePicker.vue'
import SessionSummary from '@/components/practice/SessionSummary.vue'
import SetupStep from '@/components/practice/SetupStep.vue'
import { usePracticeSetup } from '@/composables/practice/usePracticeSetup'
import { relativeTime } from '@/lib/relativeTime'

const setup = usePracticeSetup()
const {
  libraryState,
  topics,
  topicId,
  subtopicId,
  modes,
  cardCount,
  questionCount,
  dueFirst,
  interleave,
  scope,
  current,
} = setup

// "Photosynthesis" or "Biology · whole topic": what the session you can pick up is about.
const currentTitle = computed<string>(() =>
  current.value === null
    ? ''
    : (current.value.subtopic?.title ?? `${current.value.topic.title} · whole topic`),
)

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
        Practice runs on the topics in your knowledge map. Start a chat with the tutor or add a
        topic yourself, then come back.
      </p>
      <TextLink :to="{ name: 'knowledge-map' }" icon-right="arrow-right">
        Open your knowledge map
      </TextLink>
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

        <SetupStep :step="1" title="How do you want to practise?" heading-id="step-how">
          <ModePicker v-model="modes" :unavailable="setup.unavailable.value" />
        </SetupStep>

        <SetupStep :step="2" title="What do you want to practise?" heading-id="step-what">
          <ScopePicker
            v-model:topic-id="topicId"
            v-model:subtopic-id="subtopicId"
            :topics="topics"
            :show-whole-topic-tip="setup.showWholeTopicTip.value"
          />
        </SetupStep>

        <SetupStep :step="3" title="How much?" heading-id="step-amount">
          <AmountPicker
            v-model:card-count="cardCount"
            v-model:question-count="questionCount"
            v-model:due-first="dueFirst"
            v-model:interleave="interleave"
            :modes="modes"
            :whole-topic="scope?.subtopic === null"
          />
        </SetupStep>
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
          :blocks="setup.blocks.value"
          :scope="setup.scopeLabel.value"
          :order="setup.orderLabel.value"
          :loading="setup.materialState.value === 'loading'"
          :second-try="setup.secondTry.value"
          :starting="setup.starting.value"
          @start="setup.start"
        />
      </div>
    </div>
  </AppLayout>
</template>
