<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

type Tone = 'primary' | 'sun'

const {
  pressed,
  icon,
  tone = 'primary',
  count,
} = defineProps<{
  pressed: boolean
  icon?: IconName
  /** `sun` is for a filter about urgency, such as "Needs attention". */
  tone?: Tone
  /** How many items the filter shows, in a small pill after the label. */
  count?: number
}>()

const pressedClasses: Record<Tone, string> = {
  primary: 'border-primary bg-primary text-on-primary',
  sun: 'border-sun-ink bg-sun-soft text-sun-ink',
}

const pressedCountClasses: Record<Tone, string> = {
  primary: 'bg-on-primary text-primary',
  sun: 'bg-surface text-sun-ink',
}
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-label transition-colors duration-150 ease-default"
    :class="
      pressed
        ? pressedClasses[tone]
        : 'border-line bg-canvas text-ink-muted hover:border-transparent hover:bg-sprout-soft hover:text-sprout-ink'
    "
  >
    <BaseIcon v-if="icon" :name="icon" :size="15" />
    <slot />
    <!-- The space keeps label and count two words for screen readers ("All 3", not "All3"). -->
    <template v-if="count !== undefined">{{ ' ' }}</template>
    <span
      v-if="count !== undefined"
      class="inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold"
      :class="pressed ? pressedCountClasses[tone] : 'bg-surface-sunken text-ink-muted'"
      data-test="chip-count"
    >
      {{ count }}
    </span>
  </button>
</template>
