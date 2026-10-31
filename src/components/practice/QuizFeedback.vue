<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'
import type { Verdict } from '@/stores/questions'

const {
  verdict,
  secondTry = false,
  rightAnswer = null,
  feedback = null,
} = defineProps<{
  verdict: Verdict
  /** Right on the second pick of a multiple choice question. */
  secondTry?: boolean
  /** Multiple choice, after a wrong answer: the option that was right. */
  rightAnswer?: string | null
  /** What Sprout says about it: the option's explanation, or the check of your open answer. */
  feedback?: string | null
}>()

interface Look {
  title: string
  icon: IconName
  ground: string
  ink: string
}

// Correct and wrong always carry a word and an icon, never colour alone.
const looks: Record<Verdict | 'second_try', Look> = {
  correct: { title: 'Correct.', icon: 'check', ground: 'bg-sprout-soft', ink: 'text-sprout-ink' },
  second_try: {
    title: 'Got it on the second try.',
    icon: 'check',
    ground: 'bg-sprout-soft',
    ink: 'text-sprout-ink',
  },
  almost: { title: 'Almost there.', icon: 'sparkles', ground: 'bg-sun-soft', ink: 'text-sun-ink' },
  not_quite: {
    title: 'Not this time, and that’s useful.',
    icon: 'rotate-ccw',
    ground: 'bg-ember-soft',
    ink: 'text-ember-ink',
  },
}

const look = computed<Look>(() => looks[verdict === 'almost' && secondTry ? 'second_try' : verdict])
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-md px-4 py-3.5 text-body"
    :class="look.ground"
    aria-live="polite"
    data-test="quiz-feedback"
  >
    <BaseIcon :name="look.icon" :size="18" class="mt-0.5 flex-none" :class="look.ink" />
    <div class="flex flex-col gap-1 text-ink">
      <b :class="look.ink">{{ look.title }}</b>
      <span v-if="rightAnswer">
        The answer is <b>{{ rightAnswer }}</b
        >.
      </span>
      <span v-if="feedback">{{ feedback }}</span>
    </div>
  </div>
</template>
