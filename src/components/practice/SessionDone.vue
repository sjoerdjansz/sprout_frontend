<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import StatTile from '@/components/StatTile.vue'
import { practiceMode, type PracticeMode } from '@/lib/practiceModes'
import {
  isBlockComplete,
  resultLine,
  slippedItems,
  summariseCards,
  summariseQuiz,
  type BlockResult,
  type SlippedItem,
} from '@/lib/practiceSession'
import type { PracticePlan } from '@/stores/practice'

const { plan, results, minutes } = defineProps<{
  plan: PracticePlan
  results: BlockResult[]
  minutes: number
}>()

const emit = defineEmits<{
  home: []
  again: []
  openSubtopic: [subtopicId: number]
}>()

const practised = computed<BlockResult[]>(() =>
  results.filter((result) => result.status === 'started' || result.status === 'finished'),
)

const ranToTheEnd = computed<boolean>(() =>
  plan.blocks.every((block, index) => {
    const result = results[index]
    return result !== undefined && isBlockComplete(block, result)
  }),
)

const headline = computed<string>(() => {
  if (practised.value.length === 0) {
    return 'Nothing practised this time.'
  }

  return ranToTheEnd.value ? 'That’s everything you planned.' : 'Good stop. Here’s what you did.'
})

const overline = computed<string>(() => {
  const modes =
    plan.blocks.length > 1 ? 'Mixed session' : practiceMode(plan.blocks[0]?.mode ?? 'cards').name

  return `Session done · ${modes} · ${plan.title}`.toUpperCase()
})

interface Tile {
  mode: PracticeMode
  label: string
  value: string
  hint: string
}

function tileFor(result: BlockResult): Tile {
  const mode = practiceMode(result.mode)
  switch (result.mode) {
    case 'cards': {
      const summary = summariseCards(result.ratings)
      const rate = summary.reviewed === 0 ? 0 : (summary.fromMemory / summary.reviewed) * 100
      return { mode, label: 'Recall rate', value: `${Math.round(rate)}%`, hint: resultLine(result) }
    }
    case 'retrieval': {
      const summary = summariseQuiz(result.answers)
      return {
        mode,
        label: 'Quiz',
        value: `${summary.right} of ${result.answers.length}`,
        hint: `${summary.secondTry} on the second try`,
      }
    }
    case 'feynman':
      return {
        mode,
        label: 'Explain it',
        value: String(result.explanations.length),
        hint: 'Versions in your own words',
      }
    case 'open':
      return {
        mode,
        label: 'Open session',
        value: String(result.messagesSent),
        hint: 'Messages with the tutor',
      }
  }
}

const tiles = computed<Tile[]>(() => practised.value.map(tileFor))
const slipped = computed<SlippedItem[]>(() => slippedItems(results))
</script>

<template>
  <main class="flex grow justify-center px-4 pt-6 pb-10 sm:px-8" data-test="session-done">
    <div class="flex w-full max-w-240 flex-col gap-6">
      <div class="flex flex-col gap-2">
        <span class="text-overline text-sun-ink">{{ overline }}</span>
        <h1 class="font-display text-display text-ink" data-test="done-headline">{{ headline }}</h1>
        <p class="text-body-lg text-ink-muted">
          About {{ minutes }} min. Your results aren’t saved yet, so your schedule and mastery stay
          as they were.
        </p>
      </div>

      <div
        v-if="tiles.length > 0"
        class="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3.5"
      >
        <StatTile
          v-for="tile in tiles"
          :key="tile.mode.id"
          :label="tile.label"
          :value="tile.value"
          :hint="tile.hint"
          :icon="tile.mode.icon"
          :tint="tile.mode.tint"
          data-test="done-tile"
        />
      </div>

      <div class="flex flex-wrap items-start gap-5">
        <section
          v-if="plan.blocks.length > 1"
          aria-labelledby="done-blocks"
          class="flex min-w-0 flex-[1_1_320px] flex-col gap-3 rounded-xl bg-surface-tint p-5"
        >
          <h2 id="done-blocks" class="text-body-strong">Your blocks</h2>
          <ol class="flex flex-col gap-2">
            <li
              v-for="result in results"
              :key="result.mode"
              class="flex items-center justify-between gap-3 text-body"
            >
              <span>{{ practiceMode(result.mode).name }}</span>
              <span class="text-label font-normal text-ink-muted">
                {{ result.status === 'not_started' ? 'Not reached' : resultLine(result) }}
              </span>
            </li>
          </ol>
        </section>

        <section
          v-if="slipped.length > 0"
          aria-labelledby="done-slipped"
          class="flex min-w-0 flex-[1_1_400px] flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-sm"
          data-test="slipped"
        >
          <div class="flex items-baseline justify-between gap-3">
            <h2 id="done-slipped" class="text-body-strong">What slipped</h2>
            <span class="text-caption font-normal text-ink-subtle">Worth another look</span>
          </div>
          <ul class="flex flex-col gap-2">
            <li
              v-for="item in slipped"
              :key="item.key"
              class="flex items-center gap-3 rounded-md bg-canvas px-3 py-2.5"
            >
              <span class="grow text-body-strong">{{ item.title }}</span>
              <BaseBadge :tone="item.tone">{{ item.grade }}</BaseBadge>
            </li>
          </ul>
        </section>
      </div>

      <div class="flex flex-wrap justify-center gap-2.5 pt-1">
        <BaseButton size="lg" icon="house" data-test="done-home" @click="emit('home')">
          Back to dashboard
        </BaseButton>
        <BaseButton variant="secondary" size="lg" data-test="done-again" @click="emit('again')">
          Another session
        </BaseButton>
        <BaseButton
          v-if="plan.scope.subtopic"
          variant="ghost"
          size="lg"
          data-test="done-subtopic"
          @click="emit('openSubtopic', plan.scope.subtopic.id)"
        >
          Open {{ plan.scope.subtopic.title }}
        </BaseButton>
      </div>
    </div>
  </main>
</template>
