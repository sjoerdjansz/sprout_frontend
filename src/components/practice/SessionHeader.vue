<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge, { type BadgeTone } from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { practiceMode, type PracticeModeId } from '@/lib/practiceModes'
import type { Tint } from '@/components/IconTile.vue'

export interface BlockProgress {
  done: number
  total: number
  /** "4 of 10" or "Question 4 of 10". */
  text: string
}

const { mode, title, blockLabel, progress } = defineProps<{
  mode: PracticeModeId
  /** The scope: "Photosynthesis" or "Biology · mixed subtopics" (say when it's interleaved). */
  title: string
  /** "Block 2 of 3" in a mixed session. */
  blockLabel: string | null
  progress: BlockProgress | null
}>()

const emit = defineEmits<{
  end: []
}>()

const badgeTones: Record<Tint, BadgeTone> = {
  mint: 'sprout',
  sky: 'sky',
  sun: 'sun',
  peach: 'ember',
}

const badgeTone = computed<BadgeTone>(() => badgeTones[practiceMode(mode).tint])
</script>

<template>
  <header class="flex flex-none flex-col border-b border-line bg-surface">
    <div class="flex items-center gap-4 px-4 py-3 sm:px-8">
      <BaseButton variant="ghost" size="sm" icon="x" data-test="end-session" @click="emit('end')">
        End session
      </BaseButton>

      <div class="mx-auto flex min-w-0 grow flex-col gap-1.5 sm:max-w-160">
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-label">
          <span class="flex min-w-0 items-center gap-2">
            <BaseBadge :tone="badgeTone" :icon="practiceMode(mode).icon">
              {{ practiceMode(mode).name }}
            </BaseBadge>
            <b class="truncate" data-test="session-title">{{ title }}</b>
          </span>
          <span class="font-normal text-ink-muted tabular-nums" data-test="session-progress">
            <template v-if="blockLabel">{{ blockLabel }}</template>
            <template v-if="blockLabel && progress"> · </template>
            <template v-if="progress">{{ progress.text }}</template>
          </span>
        </div>
        <ProgressBar
          v-if="progress"
          :value="progress.done"
          :max="progress.total"
          size="sm"
          label="Session progress"
        />
      </div>

      <!-- Balances the End session button, so the middle stays centred. -->
      <span class="hidden w-28 sm:block" />
    </div>
  </header>
</template>
