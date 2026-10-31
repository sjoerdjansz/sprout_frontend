<script setup lang="ts">
import type { Rating } from '@/stores/flashcards'

const { intervals } = defineProps<{
  /** The next interval per grade ("3 days"), once a scheduler can say; hidden without it. */
  intervals?: Record<Rating, string>
}>()

const emit = defineEmits<{
  rate: [rating: Rating]
}>()

// Fixed order and colours from the design system; keys 1–4 map left to right.
const grades: { rating: Rating; label: string; classes: string }[] = [
  { rating: 'again', label: 'Again', classes: 'bg-ember-soft text-ember-ink' },
  { rating: 'hard', label: 'Hard', classes: 'bg-sun-soft text-sun-ink' },
  { rating: 'good', label: 'Good', classes: 'bg-sprout-soft text-sprout-ink' },
  { rating: 'easy', label: 'Easy', classes: 'bg-sky-soft text-sky-ink' },
]
</script>

<template>
  <div role="group" aria-label="Rate your recall" class="grid w-full max-w-130 grid-cols-4 gap-2">
    <button
      v-for="(grade, index) in grades"
      :key="grade.rating"
      type="button"
      class="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md px-2 py-2.5 transition-transform duration-150 ease-default hover:-translate-y-0.5 focus-visible:shadow-focus-ring focus-visible:outline-none motion-reduce:hover:translate-y-0"
      :class="grade.classes"
      :title="`Shortcut: ${index + 1}`"
      :data-test="`rate-${grade.rating}`"
      @click="emit('rate', grade.rating)"
    >
      <b class="text-body-strong">{{ grade.label }}</b>
      <span v-if="intervals" class="text-caption opacity-85">{{ intervals[grade.rating] }}</span>
    </button>
  </div>
</template>
