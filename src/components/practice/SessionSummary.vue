<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import IconTile from '@/components/IconTile.vue'
import { mixedWhy, practiceMode, whyThisHelps, type PracticeMode } from '@/lib/practiceModes'
import { blockAmount, estimateMinutes, type PracticeBlock } from '@/lib/practiceSession'

const {
  blocks,
  scope,
  order,
  loading,
  starting = false,
  secondTry,
  noModes = false,
} = defineProps<{
  blocks: PracticeBlock[]
  scope: string
  /** "Due cards first" … ; hidden when nothing has an order. */
  order: string | null
  /** The scope's cards and questions are still loading. */
  loading: boolean
  /** The session is being started on the API. */
  starting?: boolean
  /** Whether a wrong quiz answer gets a second try (your "Hint before the answer" setting). */
  secondTry: boolean
  /** You switched every mode off, so there's nothing to start until you pick one. */
  noModes?: boolean
}>()

const emit = defineEmits<{
  start: []
}>()

const modes = computed<PracticeMode[]>(() => blocks.map((block) => practiceMode(block.mode)))
const first = computed<PracticeMode | undefined>(() => modes.value[0])
const isMixed = computed<boolean>(() => modes.value.length > 1)

const title = computed<string>(() => {
  if (isMixed.value) {
    return 'Mixed session'
  }
  if (first.value !== undefined) {
    return first.value.name
  }

  return noModes ? 'Pick a way to practise' : 'Nothing to practise'
})
</script>

<template>
  <aside
    aria-label="Your session"
    class="flex flex-col gap-4.5 rounded-xl bg-surface-tint p-6 lg:sticky lg:top-8"
  >
    <div class="flex items-center gap-3">
      <IconTile v-if="isMixed" icon="shuffle" tint="peach" />
      <IconTile v-else-if="first" :icon="first.icon" :tint="first.tint" />
      <div class="flex flex-col">
        <span class="text-overline text-ink-subtle">YOUR SESSION</span>
        <b class="font-display text-title text-ink" data-test="summary-title">
          {{ title }}
        </b>
      </div>
    </div>

    <ol v-if="isMixed" class="flex flex-col gap-2" data-test="summary-blocks">
      <li
        v-for="(block, index) in blocks"
        :key="block.mode"
        class="flex items-center gap-2.5 text-body text-ink"
      >
        <span
          class="grid size-6 flex-none place-items-center rounded-full bg-surface text-caption font-bold text-ink-muted"
        >
          {{ index + 1 }}
        </span>
        <span class="grow">{{ practiceMode(block.mode).name }}</span>
        <span class="text-label font-normal text-ink-muted">{{ blockAmount(block) }}</span>
      </li>
    </ol>

    <dl class="flex flex-col gap-2.5 text-body">
      <div class="flex justify-between gap-3">
        <dt class="text-ink-muted">Scope</dt>
        <dd class="text-right font-semibold">{{ scope }}</dd>
      </div>
      <div v-if="!isMixed && blocks[0]" class="flex justify-between gap-3">
        <dt class="text-ink-muted">Amount</dt>
        <dd class="text-right font-semibold">{{ blockAmount(blocks[0]) }}</dd>
      </div>
      <div v-if="order" class="flex justify-between gap-3">
        <dt class="text-ink-muted">Order</dt>
        <dd class="text-right font-semibold">{{ order }}</dd>
      </div>
      <div v-if="blocks.length > 0" class="flex justify-between gap-3">
        <dt class="text-ink-muted">Time</dt>
        <dd class="text-right font-semibold" data-test="summary-time">
          About {{ estimateMinutes(blocks) }} min
        </dd>
      </div>
    </dl>

    <p
      v-if="first"
      class="rounded-md bg-surface px-3.5 py-3 text-label font-normal text-ink"
      data-test="why-this-helps"
    >
      <b class="block text-sprout-ink">Why this helps</b>
      {{ isMixed ? mixedWhy : whyThisHelps(first, secondTry) }}
    </p>

    <BaseButton
      size="lg"
      icon-right="arrow-right"
      block
      :disabled="loading || starting || blocks.length === 0"
      data-test="start-session"
      @click="emit('start')"
    >
      {{ loading ? 'Getting your cards…' : starting ? 'Starting…' : 'Start session' }}
    </BaseButton>
    <span class="text-center text-caption font-normal text-ink-subtle">
      You can stop at any time. Everything you practise is saved as you go.
    </span>
  </aside>
</template>
