<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import FormError from '@/components/FormError.vue'
import QuizOption, { type QuizOptionState } from '@/components/QuizOption.vue'
import QuizFeedback from '@/components/practice/QuizFeedback.vue'
import { ApiError } from '@/lib/api'
import { summariseQuiz, type QuizAnswer } from '@/lib/practiceSession'
import { usePracticeStore, type AnswerInput, type CheckedAnswer } from '@/stores/practice'
import type { Question, QuestionOption } from '@/stores/questions'

const {
  questions,
  answers,
  subtopicTitles,
  secondTry = true,
} = defineProps<{
  /** Multiple choice and open questions; the API checks every answer. */
  questions: Question[]
  /** What you answered so far in this block (also before a reload), for the footer. */
  answers: QuizAnswer[]
  subtopicTitles: Record<number, string>
  /** A wrong first pick gets a nudge and a second try ("Hint before the answer" in settings). */
  secondTry?: boolean
}>()

const emit = defineEmits<{
  finish: []
}>()

const practice = usePracticeStore()

/** `retry`: the first pick was wrong and you get a second try before the answer. */
type Phase = 'answer' | 'retry' | 'done'

// Questions are answered in order, so a session picked up again goes on after the answered ones.
const index = ref(answers.length)
const phase = ref<Phase>('answer')
const pickedId = ref<number | null>(null)
const wrongFirstId = ref<number | null>(null)
const typedAnswer = ref('')
/** The nudge after a wrong first pick: why that option was wrong. */
const nudge = ref<string | null>(null)
/** The graded answer that ended the question. */
const checked = ref<CheckedAnswer | null>(null)
const checking = ref(false)
const checkError = ref<string | null>(null)

const question = computed<Question | undefined>(() => questions[index.value])
const isOpen = computed<boolean>(() => question.value?.type === 'open')
const correctOption = computed<QuestionOption | undefined>(() =>
  question.value?.options.find((option) => option.is_correct),
)
const isLast = computed<boolean>(() => index.value >= questions.length - 1)
const score = computed(() => summariseQuiz(answers))

const canCheck = computed<boolean>(() =>
  isOpen.value ? typedAnswer.value.trim() !== '' : pickedId.value !== null,
)

async function send(input: AnswerInput): Promise<void> {
  const current = question.value
  if (current === undefined || checking.value) {
    return
  }
  checking.value = true
  checkError.value = null

  try {
    const answered = await practice.answerQuestion(current, input)
    if (!answered.try_again) {
      checked.value = answered.answer
      phase.value = 'done'
    } else if (secondTry) {
      // A second retrieval is worth more than reading the answer.
      wrongFirstId.value = pickedId.value
      pickedId.value = null
      nudge.value = answered.answer.feedback
      phase.value = 'retry'
    } else {
      // Without hints a wrong first pick ends the question; the API still offers a second try.
      checking.value = false
      await send({ dont_know: true })
    }
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    // Nothing was stored, so your pick or typed answer stays to send again.
    checkError.value = caught.message
  } finally {
    checking.value = false
  }
}

function check(): void {
  if (isOpen.value) {
    void send({ response: typedAnswer.value.trim() })
    return
  }
  if (pickedId.value !== null) {
    void send({ option_id: pickedId.value, second_try: phase.value === 'retry' })
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
  typedAnswer.value = ''
  nudge.value = null
  checked.value = null
  checkError.value = null
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

// After a wrong multiple choice answer you see the right option and why it's right.
const rightAnswer = computed<string | null>(() =>
  !isOpen.value && checked.value?.verdict === 'not_quite'
    ? (correctOption.value?.label ?? null)
    : null,
)
const feedbackText = computed<string | null>(() =>
  rightAnswer.value !== null
    ? (correctOption.value?.explanation ?? null)
    : (checked.value?.feedback ?? null),
)
</script>

<template>
  <main
    v-if="question"
    class="flex grow justify-center overflow-y-auto px-4 py-8 sm:px-8"
    data-test="quiz-block"
  >
    <div class="flex w-full max-w-170 flex-col gap-5 self-center">
      <div class="flex flex-wrap items-center gap-2">
        <BaseBadge v-if="isOpen" tone="sky" icon="brain">Open question</BaseBadge>
        <BaseBadge v-else tone="sky" icon="list-checks">Multiple choice</BaseBadge>
        <BaseBadge v-if="subtopicTitles[question.subtopic_id]">
          {{ subtopicTitles[question.subtopic_id] }}
        </BaseBadge>
        <BaseBadge v-if="phase === 'retry'" tone="sun" icon="rotate-ccw">Second try</BaseBadge>
      </div>

      <h1 class="font-display text-card-face text-balance text-ink" data-test="question-prompt">
        {{ question.prompt }}
      </h1>

      <BaseTextarea
        v-if="isOpen"
        v-model="typedAnswer"
        label="Your answer"
        rows="5"
        placeholder="Answer in your own words. No peeking!"
        :disabled="phase === 'done' || checking"
        data-test="open-answer"
      />
      <div v-else class="flex flex-col gap-2.5">
        <QuizOption
          v-for="(option, optionIndex) in question.options"
          :key="option.id"
          :letter="letters[optionIndex] ?? '?'"
          :state="optionState(option)"
          :disabled="phase === 'done' || checking || option.id === wrongFirstId"
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

      <p
        v-if="checking && isOpen"
        class="text-body text-ink-muted"
        aria-live="polite"
        data-test="quiz-checking"
      >
        Sprout is checking your answer…
      </p>

      <QuizFeedback
        v-if="checked?.verdict"
        :verdict="checked.verdict"
        :second-try="wrongFirstId !== null"
        :right-answer="rightAnswer"
        :feedback="feedbackText"
      />

      <FormError v-if="checkError" :message="checkError" />

      <div class="flex items-center justify-between gap-3 pt-1">
        <BaseButton
          variant="ghost"
          size="sm"
          icon="circle-help"
          :disabled="phase === 'done' || checking"
          data-test="dont-know"
          @click="send({ dont_know: true })"
        >
          I don’t know
        </BaseButton>
        <BaseButton
          v-if="phase !== 'done'"
          size="lg"
          :disabled="!canCheck || checking"
          data-test="check-answer"
          @click="check"
        >
          {{ checking ? 'Checking…' : 'Check answer' }}
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
      ><b class="text-sun-ink">{{ score.almost }}</b> almost</span
    >
    <span
      ><b class="text-ember-ink">{{ score.wrong }}</b> wrong</span
    >
    <BaseButton variant="secondary" size="sm" data-test="finish-block" @click="emit('finish')">
      Finish early
    </BaseButton>
  </footer>
</template>
