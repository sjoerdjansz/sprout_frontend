<script setup lang="ts">
import IconTile, { type Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'

type Tone = 'sun' | 'sprout' | 'ember' | 'sky'

const {
  title,
  message,
  tone = 'sun',
  icon,
} = defineProps<{
  title: string
  /** One line under the title. */
  message?: string
  /** `sprout` for saved, `ember` for an undoable delete, `sun` for rewards. */
  tone?: Tone
  icon: IconName
}>()

const tileTints: Record<Tone, Tint> = {
  sun: 'sun',
  sprout: 'mint',
  ember: 'peach',
  sky: 'sky',
}
</script>

<!--
  One toast at a time, bottom-centre on phones and bottom-right from `sm` (design system rule).
  The parent decides how long it stays (v-if); `role="status"` announces it.
-->
<template>
  <div
    class="fixed inset-x-4 bottom-6 z-20 flex justify-center sm:right-8 sm:left-auto sm:justify-end"
  >
    <div
      role="status"
      class="flex max-w-105 animate-pop items-center gap-3 rounded-lg border border-line bg-surface py-3 pr-4 pl-3 shadow-lg motion-reduce:animate-none"
      data-test="toast"
    >
      <IconTile :icon="icon" :tint="tileTints[tone]" />
      <div class="min-w-0 flex-auto">
        <b class="block text-[15px] leading-5 font-[650] text-ink" data-test="toast-title">
          {{ title }}
        </b>
        <span v-if="message" class="text-label font-normal text-ink-muted">{{ message }}</span>
      </div>
      <slot />
    </div>
  </div>
</template>
