<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import FlashCard from '@/components/FlashCard.vue'
import RatingBar from '@/components/RatingBar.vue'
import type { CardRating } from '@/lib/practiceSession'
import type { Flashcard, Rating } from '@/stores/flashcards'

const { cards, ratings, subtopicTitles } = defineProps<{
  cards: Flashcard[]
  /** What you rated so far in this block, for the counts in the footer. */
  ratings: CardRating[]
  subtopicTitles: Record<number, string>
}>()

const emit = defineEmits<{
  rate: [card: Flashcard, rating: Rating]
  finish: []
}>()

// The cards still to go, in order. A card rated "Again" goes to the back, so it comes back later.
const queue = ref<Flashcard[]>([...cards])
const flipped = ref(false)
const lastWasAgain = ref(false)

const card = computed<Flashcard | undefined>(() => queue.value[0])

const counts = computed(() => ({
  good: ratings.filter(({ rating }) => rating === 'good' || rating === 'easy').length,
  hard: ratings.filter(({ rating }) => rating === 'hard').length,
  again: ratings.filter(({ rating }) => rating === 'again').length,
}))

function rate(rating: Rating): void {
  const current = card.value
  if (current === undefined || !flipped.value) {
    return
  }
  emit('rate', current, rating)

  const rest = queue.value.slice(1)
  queue.value = rating === 'again' ? [...rest, current] : rest
  lastWasAgain.value = rating === 'again'
  flipped.value = false

  if (queue.value.length === 0) {
    emit('finish')
  }
}

const ratingKeys: Record<string, Rating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }

// Space flips and 1–4 rate, but not while you're on a control that has its own keys.
function onKeydown(event: KeyboardEvent): void {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('button, input, textarea, a')) {
    return
  }
  if (event.key === ' ') {
    event.preventDefault()
    flipped.value = !flipped.value
    return
  }
  const rating = ratingKeys[event.key]
  if (rating !== undefined) {
    rate(rating)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <main
    v-if="card"
    class="flex grow flex-col items-center justify-center gap-6 px-4 py-6 sm:px-8"
    data-test="flashcard-block"
  >
    <div class="flex items-center gap-2">
      <BaseBadge v-if="card.is_due" tone="sun" icon="repeat">Due today</BaseBadge>
      <BaseBadge v-if="card.last_reviewed_at === null" tone="sky" icon="sparkles">
        New card
      </BaseBadge>
    </div>

    <FlashCard
      v-model:flipped="flipped"
      :front="card.front"
      :back="card.back"
      :topic="subtopicTitles[card.subtopic_id]"
    />

    <div class="flex min-h-28 w-full max-w-140 flex-col items-center gap-3">
      <template v-if="!flipped">
        <p class="max-w-110 text-center text-body text-ink-muted">
          Say the answer out loud or in your head first. Only then flip.
        </p>
        <BaseButton size="lg" icon="rotate-ccw" data-test="show-answer" @click="flipped = true">
          Show answer
        </BaseButton>
      </template>
      <template v-else>
        <RatingBar @rate="rate" />
      </template>
      <p
        v-if="lastWasAgain"
        class="flex items-center gap-2 text-label font-normal text-ember-ink"
        aria-live="polite"
      >
        <BaseIcon name="rotate-ccw" :size="14" />
        That one comes back later in this session.
      </p>
    </div>

    <p class="hidden flex-wrap justify-center gap-3.5 text-caption text-ink-subtle sm:flex">
      <span class="inline-flex items-center gap-1.5">
        <kbd class="rounded-xs border border-line-strong bg-surface px-1.5 font-mono">Space</kbd>
        flip
      </span>
      <span class="inline-flex items-center gap-1.5">
        <kbd class="rounded-xs border border-line-strong bg-surface px-1.5 font-mono">1</kbd>–<kbd
          class="rounded-xs border border-line-strong bg-surface px-1.5 font-mono"
          >4</kbd
        >
        rate
      </span>
    </p>
  </main>

  <footer
    class="flex flex-none flex-wrap items-center justify-end gap-3.5 border-t border-line bg-surface px-4 py-3 text-label font-normal text-ink-muted sm:px-8"
  >
    <span
      ><b class="text-sprout-ink">{{ counts.good }}</b> good</span
    >
    <span
      ><b class="text-sun-ink">{{ counts.hard }}</b> hard</span
    >
    <span
      ><b class="text-ember-ink">{{ counts.again }}</b> again</span
    >
    <BaseButton variant="secondary" size="sm" data-test="finish-block" @click="emit('finish')">
      Finish early
    </BaseButton>
  </footer>
</template>
