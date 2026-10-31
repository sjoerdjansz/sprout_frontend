<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import IconTile from '@/components/IconTile.vue'
import { practiceMode, type PracticeMode } from '@/lib/practiceModes'
import {
  blockAmount,
  resultLine,
  type BlockResult,
  type PracticeBlock,
} from '@/lib/practiceSession'

const { previous, next, position } = defineProps<{
  /** The block you just finished or skipped. */
  previous: BlockResult
  next: PracticeBlock
  /** "Block 2 of 3", the position of the next block. */
  position: string
}>()

const emit = defineEmits<{
  start: []
  skip: []
  finish: []
}>()

const previousMode = computed<PracticeMode>(() => practiceMode(previous.mode))
const nextMode = computed<PracticeMode>(() => practiceMode(next.mode))

const previousTitle = computed<string>(
  () => `${previousMode.value.name} ${previous.status === 'skipped' ? 'skipped' : 'done'}.`,
)
const previousLine = computed<string>(() =>
  previous.status === 'skipped' ? '' : `${resultLine(previous)}.`,
)
</script>

<!-- Between two blocks of a mixed session: how the last one went and what comes next. -->
<template>
  <main class="flex grow items-center justify-center px-4 py-8 sm:px-8" data-test="next-up">
    <div class="flex w-full max-w-140 flex-col gap-6">
      <p class="flex items-center gap-3 text-body text-ink-muted" aria-live="polite">
        <span
          class="grid size-7 flex-none place-items-center rounded-full bg-sprout text-on-sprout"
        >
          <BaseIcon name="check" :size="16" />
        </span>
        <span>
          <b class="text-ink">{{ previousTitle }}</b>
          {{ previousLine }}
        </span>
      </p>

      <section
        aria-labelledby="next-up-heading"
        class="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-sm"
      >
        <span class="text-overline text-ink-subtle">NEXT UP · {{ position.toUpperCase() }}</span>
        <div class="flex items-center gap-3">
          <IconTile :icon="nextMode.icon" :tint="nextMode.tint" />
          <div class="flex flex-col">
            <h1 id="next-up-heading" class="font-display text-title text-ink">
              {{ nextMode.name }}
            </h1>
            <span class="text-label font-normal text-ink-muted">{{ blockAmount(next) }}</span>
          </div>
        </div>
        <p class="text-body text-ink-muted">{{ nextMode.blurb }}</p>
        <div class="flex flex-wrap gap-2">
          <BaseButton icon-right="arrow-right" data-test="start-next" @click="emit('start')">
            Start {{ nextMode.name.toLowerCase() }}
          </BaseButton>
          <BaseButton variant="ghost" data-test="skip-next" @click="emit('skip')">
            Skip this one
          </BaseButton>
        </div>
      </section>

      <BaseButton
        variant="secondary"
        class="self-start"
        data-test="finish-here"
        @click="emit('finish')"
      >
        Finish here and see results
      </BaseButton>
    </div>
  </main>
</template>
