<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'
import QuizOption, { type QuizOptionState } from '@/components/QuizOption.vue'
import { summariseQuiz, type QuizAnswer, type QuizOutcome } from '@/lib/practiceSession'
import type { Question, QuestionOption } from '@/stores/questions'

const { questions, answers, subtopicTitles } = defineProps<{
  /** Multiple choice only: they're checked here, from `is_correct`. */
  questions: Question[]
  /** What you answered so far in this block, for the score in the footer. */
  answers: QuizAnswer[]
  subtopicTitles: Record<number, string>
}>()

const emit = defineEmits<{
  answer: [question: Question, outcome: QuizOutcome]
  finish: []
}>()

/** `retry`: the first pick was wrong and you get a second try before the answer. */
type Phase = 'answer' | 'retry' | 'done'

const index = ref(0)
const phase = ref<Phase>('answer')
const pickedId = ref<number | null>(null)
const wrongFirstId = ref<number | null>(null)
const outcome = ref<QuizOutcome | null>(null)

const question = computed<Question | undefined>(() => questions[index.value])
const correctOption = computed<QuestionOption | undefined>(() =>
  question.value?.options.find((option) => option.is_correct),
)
const isLast = computed<boolean>(() => index.value >= questions.length - 1)
const score = computed(() => summariseQuiz(answers))

function finishQuestion(result: QuizOutcome): void {
  if (question.value === undefined) {
    return
  }
  outcome.value = result
  phase.value = 'done'
  emit('answer', question.value, result)
}

function check(): void {
  const picked = question.value?.options.find((option) => option.id === pickedId.value)
  if (picked === undefined) {
    return
  }
  if (picked.is_correct) {
    finishQuestion(phase.value === 'retry' ? 'second_try' : 'right')
  } else if (phase.value === 'answer') {
    // A second retrieval is worth more than reading the answer.
    wrongFirstId.value = picked.id
    pickedId.value = null
    phase.value = 'retry'
  } else {
    finishQuestion('wrong')
  }
}

function next(): void {
  if (isLast.value) {
    emit('finish')
    return
  }
  index.value += 1
  phase.value = 'answer'
  pickedId.value = null
  wrongFirstId.value = null
  outcome.value = null
}

function optionState(option: QuestionOption): QuizOptionState {
  if (phase.value === 'done') {
    if (option.is_correct) {
      return pickedId.value === option.id ? 'correct' : 'missed'
    }
    return option.id === pickedId.value || option.id === wrongFirstId.value ? 'wrong' : 'idle'
  }
  if (option.id === wrongFirstId.value) {
    return 'wrong'
  }

  return option.id === pickedId.value ? 'selected' : 'idle'
}

const letters = 'ABCDEFGH'

// The hint after a wrong first try: why that pick was wrong, when the question says so.
const nudge = computed<string | null>(
  () =>
    question.value?.options.find((option) => option.id === wrongFirstId.value)?.explanation ?? null,
)

interface Feedback {
  title: string
  icon: IconName
  ground: string
  ink: string
}

const feedback = computed<Feedback | null>(() => {
  switch (outcome.value) {
    case 'right':
      return { title: 'Correct.', icon: 'check', ground: 'bg-sprout-soft', ink: 'text-sprout-ink' }
    case 'second_try':
      return {
        title: 'Got it on the second try.',
        icon: 'check',
        ground: 'bg-sprout-soft',
        ink: 'text-sprout-ink',
      }
    case 'wrong':
      return {
        title: 'Not this time, and that’s useful.',
        icon: 'rotate-ccw',
        ground: 'bg-ember-soft',
        ink: 'text-ember-ink',
      }
    default:
      return null
  }
})
</script>

<template>
  <main
    v-if="question"
    class="flex grow justify-center overflow-y-auto px-4 py-8 sm:px-8"
    data-test="quiz-block"
  >
    <div class="flex w-full max-w-170 flex-col gap-5 self-center">
      <div class="flex flex-wrap items-center gap-2">
        <BaseBadge tone="sky" icon="list-checks">Multiple choice</BaseBadge>
        <BaseBadge v-if="subtopicTitles[question.subtopic_id]">
          {{ subtopicTitles[question.subtopic_id] }}
        </BaseBadge>
        <BaseBadge v-if="phase === 'retry'" tone="sun" icon="rotate-ccw">Second try</BaseBadge>
      </div>

      <h1 class="font-display text-card-face text-balance text-ink" data-test="question-prompt">
        {{ question.prompt }}
      </h1>

      <div class="flex flex-col gap-2.5">
        <QuizOption
          v-for="(option, optionIndex) in question.options"
          :key="option.id"
          :letter="letters[optionIndex] ?? '?'"
          :state="optionState(option)"
          :disabled="phase === 'done' || option.id === wrongFirstId"
          :data-test="`option-${option.id}`"
          @select="pickedId = option.id"
        >
          {{ option.label }}
        </QuizOption>
      </div>

      <div
        v-if="phase === 'retry'"
        class="flex items-start gap-3 rounded-md bg-sun-soft px-4 py-3.5 text-body"
        aria-live="polite"
        data-test="quiz-retry"
      >
        <BaseIcon name="lightbulb" :size="18" class="mt-0.5 flex-none text-sun-ink" />
        <div class="flex flex-col gap-0.5">
          <b class="text-sun-ink">Not quite. Try once more.</b>
          <span v-if="nudge">{{ nudge }}</span>
          <span class="text-caption font-normal text-ink-subtle">
            A second retrieval is worth more than reading the answer.
          </span>
        </div>
      </div>

      <div
        v-if="feedback"
        class="flex items-start gap-3 rounded-md px-4 py-3.5 text-body"
        :class="feedback.ground"
        aria-live="polite"
        data-test="quiz-feedback"
      >
        <BaseIcon :name="feedback.icon" :size="18" class="mt-0.5 flex-none" :class="feedback.ink" />
        <div class="flex flex-col gap-1 text-ink">
          <b :class="feedback.ink">{{ feedback.title }}</b>
          <span v-if="outcome === 'wrong' && correctOption">
            The answer is <b>{{ correctOption.label }}</b
            >.
          </span>
          <span v-if="correctOption?.explanation">{{ correctOption.explanation }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 pt-1">
        <BaseButton
          variant="ghost"
          size="sm"
          icon="circle-help"
          :disabled="phase === 'done'"
          data-test="dont-know"
          @click="finishQuestion('wrong')"
        >
          I don’t know
        </BaseButton>
        <BaseButton
          v-if="phase !== 'done'"
          size="lg"
          :disabled="pickedId === null"
          data-test="check-answer"
          @click="check"
        >
          Check answer
        </BaseButton>
        <BaseButton
          v-else
          size="lg"
          icon-right="arrow-right"
          data-test="next-question"
          @click="next"
        >
          {{ isLast ? 'Finish quiz' : 'Next question' }}
        </BaseButton>
      </div>
    </div>
  </main>

  <footer
    class="flex flex-none flex-wrap items-center justify-end gap-3.5 border-t border-line bg-surface px-4 py-3 text-label font-normal text-ink-muted sm:px-8"
  >
    <span
      ><b class="text-sprout-ink">{{ score.right }}</b> right</span
    >
    <span
      ><b class="text-sun-ink">{{ score.secondTry }}</b> on 2nd try</span
    >
    <span
      ><b class="text-ember-ink">{{ score.wrong }}</b> wrong</span
    >
    <BaseButton variant="secondary" size="sm" data-test="finish-block" @click="emit('finish')">
      Finish early
    </BaseButton>
  </footer>
</template>
