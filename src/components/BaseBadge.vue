<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

type Tone = 'neutral' | 'sprout' | 'sun' | 'ember' | 'sky'

const { tone = 'neutral', icon } = defineProps<{
  tone?: Tone
  icon?: IconName
}>()

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted',
  sprout: 'bg-sprout-soft text-sprout-ink',
  sun: 'bg-sun-soft text-sun-ink',
  ember: 'bg-ember-soft text-ember-ink',
  sky: 'bg-sky-soft text-sky-ink',
}
</script>

<template>
  <span
    class="inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-caption font-semibold whitespace-nowrap"
    :class="toneClasses[tone]"
  >
    <BaseIcon v-if="icon" :name="icon" :size="14" />
    <slot />
  </span>
</template>
