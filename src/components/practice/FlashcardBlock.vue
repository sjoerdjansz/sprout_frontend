<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import FlashCard from '@/components/FlashCard.vue'
import FormError from '@/components/FormError.vue'
import RatingBar from '@/components/RatingBar.vue'
import { ApiError } from '@/lib/api'
import { ratingIntervals, type CardRating } from '@/lib/practiceSession'
import type { Flashcard, Rating } from '@/stores/flashcards'
import { usePracticeStore } from '@/stores/practice'

const { cards, ratings, subtopicTitles } = defineProps<{
  cards: Flashcard[]
  /** What you rated so far in this block (also before a reload), for the footer and the queue. */
  ratings: CardRating[]
  subtopicTitles: Record<number, string>
}>()

const emit = defineEmits<{
  finish: []
}>()

const practice = usePracticeStore()

// A card is done once its latest rating isn't "Again"; a session picked up again skips those.
function isDone(card: Flashcard): boolean {
  const ownRatings = ratings.filter((entry) => entry.card.id === card.id)
  const latest = ownRatings[ownRatings.length - 1]

  return latest !== undefined && latest.rating !== 'again'
}

// The cards still to go, in order. A card rated "Again" goes to the back, so it comes back later.
const queue = ref<Flashcard[]>(cards.filter((card) => !isDone(card)))
const flipped = ref(false)
const lastWasAgain = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)

const card = computed<Flashcard | undefined>(() => queue.value[0])

const counts = computed(() => ({
  good: ratings.filter(({ rating }) => rating === 'good' || rating === 'easy').length,
  hard: ratings.filter(({ rating }) => rating === 'hard').length,
  again: ratings.filter(({ rating }) => rating === 'again').length,
}))

// The rating is saved before the next card shows; if that fails, the card stays to rate again.
async function rate(rating: Rating): Promise<void> {
  const current = card.value
  if (current === undefined || !flipped.value || saving.value) {
    return
  }
  saving.value = true
  saveError.value = null

  try {
    const rescheduled = await practice.rateCard(current, rating)
    const rest = queue.value.slice(1)
    queue.value = rating === 'again' ? [...rest, rescheduled] : rest
    lastWasAgain.value = rating === 'again'
    flipped.value = false
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    saveError.value = caught.message
    return
  } finally {
    saving.value = false
  }

  if (queue.value.length === 0) {
    emit('finish')
  }
}

const ratingKeys: Record<string, Rating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }

// Space flips and 1–4 rate, also right after clicking the card. Not while typing, and Space
// on a focused button or link already presses it (the card's own click flips it).
function onKeydown(event: KeyboardEvent): void {
  const target = event.target instanceof HTMLElement ? event.target : null
  if (target?.closest('input, textarea')) {
    return
  }
  if (event.key === ' ') {
    if (target?.closest('button, a')) {
      return
    }
    event.preventDefault()
    flipped.value = !flipped.value
    return
  }
  const rating = ratingKeys[event.key]
  if (rating !== undefined) {
    void rate(rating)
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
    <!-- A fixed height, so the card doesn't jump when a card has no badges. -->
    <div class="flex min-h-6 items-center gap-2">
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
        <!-- Not disabled while saving, so focus stays put; rate() waits for the save. -->
        <RatingBar :intervals="ratingIntervals(card)" @rate="rate" />
      </template>
      <FormError v-if="saveError" :message="saveError" />
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
