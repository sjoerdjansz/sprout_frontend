<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

type Tone = 'primary' | 'sun'

const {
  pressed,
  icon,
  tone = 'primary',
} = defineProps<{
  pressed: boolean
  icon?: IconName
  /** `sun` is for a filter about urgency, such as "Needs attention". */
  tone?: Tone
}>()

const pressedClasses: Record<Tone, string> = {
  primary: 'border-primary bg-primary text-on-primary',
  sun: 'border-sun-ink bg-sun-soft text-sun-ink',
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
  </button>
</template>
