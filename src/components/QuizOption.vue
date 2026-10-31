<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

/** `missed`: the right answer you didn't pick, shown once the question is over. */
export type QuizOptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed'

const { letter, state } = defineProps<{
  letter: string
  state: QuizOptionState
  /** Can't be picked (the question is over, or this was your wrong first try). */
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const stateClasses: Record<QuizOptionState, { option: string; key: string }> = {
  idle: {
    option: 'border-line bg-surface hover:border-line-strong',
    key: 'bg-surface-sunken text-ink-muted',
  },
  selected: { option: 'border-primary bg-surface-tint', key: 'bg-primary text-on-primary' },
  correct: { option: 'border-sprout bg-sprout-soft', key: 'bg-sprout text-on-sprout' },
  wrong: {
    option: 'animate-shake border-ember bg-ember-soft motion-reduce:animate-none',
    key: 'bg-ember text-on-ember',
  },
  missed: {
    option: 'border-dashed border-sprout bg-surface',
    key: 'bg-surface-sunken text-ink-muted',
  },
}

// Feedback always carries a word and an icon, never colour alone.
const marks: Partial<Record<QuizOptionState, { icon: IconName; label: string; classes: string }>> =
  {
    correct: { icon: 'check', label: 'Correct', classes: 'text-sprout-ink' },
    wrong: { icon: 'x', label: 'Not quite', classes: 'text-ember-ink' },
    missed: { icon: 'check', label: 'Right answer', classes: 'text-sprout-ink' },
  }

const mark = computed(() => marks[state])
</script>

<template>
  <button
    type="button"
    class="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border-[1.5px] py-3 pr-4 pl-3 text-left text-body text-ink shadow-xs transition-colors duration-150 ease-default focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-default"
    :class="stateClasses[state].option"
    :aria-pressed="state === 'selected'"
    :disabled="disabled"
    :data-state="state"
    @click="emit('select')"
  >
    <span
      class="grid size-7.5 flex-none place-items-center rounded-sm text-label font-bold"
      :class="stateClasses[state].key"
    >
      {{ letter }}
    </span>
    <span class="flex-1"><slot /></span>
    <span
      v-if="mark"
      class="inline-flex flex-none items-center gap-1 text-caption font-bold"
      :class="mark.classes"
    >
      <BaseIcon :name="mark.icon" :size="16" />
      {{ mark.label }}
    </span>
  </button>
</template>
