<script setup lang="ts">
import { computed } from 'vue'
import IconTile from '@/components/IconTile.vue'
import { mixedWhy, practiceMode, whyThisHelps, type PracticeMode } from '@/lib/practiceModes'
import { blockAmount, estimateMinutes, type PracticeBlock } from '@/lib/practiceSession'

const { blocks, scope, order, secondTry } = defineProps<{
  blocks: PracticeBlock[]
  /** "Photosynthesis" or "All subtopics from Biology". */
  scope: string
  /** "Due cards first" … ; left out when nothing has an order. */
  order: string | null
  /** Whether a wrong quiz answer gets a second try (your "Hint before the answer" setting). */
  secondTry: boolean
}>()

const first = computed<PracticeMode | undefined>(() => {
  const [block] = blocks

  return block === undefined ? undefined : practiceMode(block.mode)
})
const isMixed = computed<boolean>(() => blocks.length > 1)
</script>

<!-- The last step's recap of everything you picked: the blocks in order, then the facts. -->
<template>
  <section aria-labelledby="session-recap" class="flex flex-col gap-4" data-test="session-recap">
    <span id="session-recap" class="text-overline text-ink-subtle">YOUR SESSION</span>

    <p v-if="blocks.length === 0" class="text-body text-ink-muted">
      Pick a way to practise in the first step.
    </p>

    <ol v-else class="flex flex-col gap-2 motion-safe:stagger-pop" data-test="summary-blocks">
      <li
        v-for="(block, index) in blocks"
        :key="block.mode"
        class="flex items-center gap-3 rounded-md bg-surface-tint px-3.5 py-2.5"
      >
        <span
          class="grid size-6 flex-none place-items-center rounded-full bg-surface text-caption font-bold text-ink-muted"
        >
          {{ index + 1 }}
        </span>
        <IconTile
          :icon="practiceMode(block.mode).icon"
          :tint="practiceMode(block.mode).tint"
          size="sm"
        />
        <span class="flex min-w-0 grow flex-col">
          <b class="text-body-strong text-ink" data-test="recap-mode">{{
            practiceMode(block.mode).name
          }}</b>
          <span class="hidden text-caption font-normal text-ink-muted sm:block">
            {{ practiceMode(block.mode).blurb }}
          </span>
        </span>
        <span class="flex-none text-right text-label text-ink" data-test="summary-amount">
          {{ blockAmount(block) }}
        </span>
      </li>
    </ol>

    <!-- Figures rather than a sentence, so each fact can be read at a glance. -->
    <dl v-if="blocks.length > 0" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="col-span-2 flex min-w-0 flex-col gap-0.5 sm:col-span-1">
        <dt class="text-caption text-ink-subtle">Scope</dt>
        <dd class="truncate text-body-strong text-ink" data-test="summary-scope">{{ scope }}</dd>
      </div>
      <div v-if="order" class="flex min-w-0 flex-col gap-0.5">
        <dt class="text-caption text-ink-subtle">Order</dt>
        <dd class="text-body-strong text-ink">{{ order }}</dd>
      </div>
      <div class="flex min-w-0 flex-col gap-0.5">
        <dt class="text-caption text-ink-subtle">Time</dt>
        <dd class="font-display text-title text-ink" data-test="summary-time">
          About {{ estimateMinutes(blocks) }} min
        </dd>
      </div>
    </dl>

    <p
      v-if="first"
      class="rounded-md bg-sprout-soft px-3.5 py-3 text-label font-normal text-ink"
      data-test="why-this-helps"
    >
      <b class="block text-sprout-ink">Why this helps</b>
      {{ isMixed ? mixedWhy : whyThisHelps(first, secondTry) }}
    </p>
  </section>
</template>
