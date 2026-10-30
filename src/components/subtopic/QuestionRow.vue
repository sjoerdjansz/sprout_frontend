<script setup lang="ts">
import { computed, useId } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import MaterialRow from '@/components/subtopic/MaterialRow.vue'
import { relativeTime } from '@/lib/relativeTime'
import { answerText, questionTypeLooks, verdictLooks } from '@/lib/subtopicPage'
import { capitalize } from '@/lib/text'
import type { Question, QuestionOption, Verdict } from '@/stores/questions'

const { question, expanded } = defineProps<{
  question: Question
  expanded: boolean
}>()

const emit = defineEmits<{
  toggle: []
  remove: []
}>()

const detailsId = useId()

const typeLook = computed(() => questionTypeLooks[question.type])
const verdictLook = computed(() =>
  question.latest_answer === null ? null : verdictLooks[question.latest_answer.verdict],
)
const answer = computed<string | null>(() => answerText(question))

const feedbackClasses: Record<Verdict, { panel: string; heading: string }> = {
  correct: { panel: 'bg-sprout-soft', heading: 'text-sprout-ink' },
  almost: { panel: 'bg-sun-soft', heading: 'text-sun-ink' },
  not_quite: { panel: 'bg-ember-soft', heading: 'text-ember-ink' },
}

function optionMark(option: QuestionOption): string {
  const picked = question.latest_answer?.option_id === option.id
  if (option.is_correct) {
    return picked ? 'Correct' : 'Right answer'
  }

  return picked ? 'Your pick' : ''
}

function optionClasses(option: QuestionOption): string {
  if (option.is_correct) {
    return 'bg-sprout-soft text-sprout-ink'
  }

  return question.latest_answer?.option_id === option.id
    ? 'bg-ember-soft text-ember-ink'
    : 'text-ink'
}
</script>

<template>
  <MaterialRow
    :icon="typeLook.icon"
    :tint="typeLook.tint"
    :highlighted="expanded"
    data-test="question"
  >
    <button
      type="button"
      :aria-expanded="expanded"
      :aria-controls="detailsId"
      class="flex cursor-pointer flex-col gap-0.5 rounded-sm text-left"
      data-test="toggle-question"
      @click="emit('toggle')"
    >
      <b class="text-[15px] leading-5 font-[650] text-ink">{{ question.prompt }}</b>
      <span class="line-clamp-1 text-label font-normal text-ink-muted">
        {{ answer === null ? 'Not answered yet' : `You: ${answer}` }}
      </span>
    </button>

    <div v-if="expanded" :id="detailsId" class="mt-2.5 flex max-w-180 flex-col gap-2">
      <ol v-if="question.options.length > 0" class="flex flex-col gap-1">
        <li
          v-for="(option, index) in question.options"
          :key="option.id"
          class="flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-label font-normal"
          :class="optionClasses(option)"
          data-test="option"
        >
          <span
            aria-hidden="true"
            class="inline-grid size-5.5 flex-none place-items-center rounded-xs bg-surface text-[11px] font-bold text-ink-muted"
          >
            {{ 'ABCDEFGH'.charAt(index) }}
          </span>
          <span class="flex-auto">{{ option.label }}</span>
          <span class="text-caption font-bold">{{ optionMark(option) }}</span>
        </li>
      </ol>

      <div
        v-if="question.type !== 'multiple_choice' && question.latest_answer?.response"
        class="rounded-sm bg-surface px-3 py-2.5"
      >
        <span class="block text-overline text-ink-subtle">YOUR ANSWER</span>
        <p class="mt-1 text-[14px] leading-5 text-ink">{{ question.latest_answer.response }}</p>
      </div>

      <div
        v-if="question.latest_answer !== null"
        class="rounded-sm px-3 py-2.5"
        :class="feedbackClasses[question.latest_answer.verdict].panel"
        data-test="feedback"
      >
        <span
          class="block text-overline"
          :class="feedbackClasses[question.latest_answer.verdict].heading"
        >
          SPROUT’S FEEDBACK
        </span>
        <p class="mt-1 text-[14px] leading-5 text-ink">{{ question.latest_answer.feedback }}</p>
      </div>
      <p v-else class="text-label font-normal text-ink-muted">
        Answer it in a practice session and Sprout’s feedback shows up here.
      </p>
    </div>

    <template #meta>
      <BaseBadge
        v-if="verdictLook !== null"
        :tone="verdictLook.tone"
        :icon="verdictLook.icon"
        data-test="verdict"
      >
        {{ verdictLook.label }}
      </BaseBadge>
      <span class="text-caption font-normal text-ink-subtle">
        {{ typeLook.label }}
        <template v-if="question.latest_answer !== null">
          · {{ capitalize(relativeTime(question.latest_answer.answered_at)) }}
        </template>
      </span>
    </template>

    <template #actions>
      <BaseIconButton
        :icon="expanded ? 'chevron-down' : 'chevron-right'"
        :label="expanded ? 'Collapse' : 'Show answer and feedback'"
        size="sm"
        @click="emit('toggle')"
      />
      <!-- No practice sessions yet (see ../specs/subtopic-page.md). -->
      <BaseIconButton icon="rotate-ccw" label="Ask me again · Coming soon" size="sm" disabled />
      <BaseIconButton
        icon="trash-2"
        label="Delete question"
        size="sm"
        data-test="delete-question"
        @click="emit('remove')"
      />
    </template>
  </MaterialRow>
</template>
