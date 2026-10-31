<script setup lang="ts">
import { useId } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import { ratingLabels } from '@/lib/ratings'
import type { Rating } from '@/stores/flashcards'

const { intervals } = defineProps<{
  /** When the card comes back per grade ("3 days"); hidden without it. */
  intervals?: Record<Rating, string>
}>()

const emit = defineEmits<{
  rate: [rating: Rating]
}>()

// Keys 1–4 still map left to right: 1 is "Missed it", 2–4 the grades of a card you knew.
const knewIt: Rating[] = ['hard', 'good', 'easy']
const gotItId = useId()
</script>

<!--
  First whether you knew the card, then how easily: "Missed it" stands apart (the card comes back
  in this session), the three grades of a card you knew sit together under "Got it".
  Deviates from the design system's four equal buttons; see ../specs/practice-session.md.
-->
<template>
  <div class="flex w-full max-w-140 flex-col gap-2.5 sm:flex-row sm:items-stretch">
    <button
      type="button"
      class="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md bg-ember-soft px-4 py-2.5 text-ember-ink transition-transform duration-150 ease-default hover:-translate-y-0.5 focus-visible:shadow-focus-ring focus-visible:outline-none motion-reduce:hover:translate-y-0 sm:w-36 sm:flex-none"
      title="Shortcut: 1"
      data-test="rate-again"
      @click="emit('rate', 'again')"
    >
      <b class="flex items-center gap-1.5 text-body-strong">
        <BaseIcon name="rotate-ccw" :size="16" />
        {{ ratingLabels.again }}
      </b>
      <span v-if="intervals" class="text-caption opacity-85">Back in {{ intervals.again }}</span>
    </button>

    <div
      role="group"
      :aria-labelledby="gotItId"
      class="flex grow flex-col gap-1.5 rounded-md bg-sprout-soft p-1.5"
    >
      <span :id="gotItId" class="flex items-center gap-1 px-1.5 text-overline text-sprout-ink">
        <BaseIcon name="check" :size="14" />
        GOT IT
      </span>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="(rating, index) in knewIt"
          :key="rating"
          type="button"
          class="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-sm bg-surface px-2 py-2 text-sprout-ink shadow-xs transition-transform duration-150 ease-default hover:-translate-y-0.5 focus-visible:shadow-focus-ring focus-visible:outline-none motion-reduce:hover:translate-y-0"
          :title="`Shortcut: ${index + 2}`"
          :data-test="`rate-${rating}`"
          @click="emit('rate', rating)"
        >
          <b class="text-body-strong">{{ ratingLabels[rating] }}</b>
          <span v-if="intervals" class="text-caption text-ink-muted">{{ intervals[rating] }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
