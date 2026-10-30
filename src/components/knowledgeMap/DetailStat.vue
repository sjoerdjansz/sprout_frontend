<script setup lang="ts">
type Tone = 'ink' | 'sun' | 'sprout'

const {
  label,
  value,
  tone = 'ink',
  large = false,
} = defineProps<{
  label: string
  value: string | number
  /** `sun` when something is due, `sprout` for mastered counts. */
  tone?: Tone
  /** A big display number instead of a short phrase. */
  large?: boolean
}>()

const toneClasses: Record<Tone, string> = {
  ink: 'text-ink',
  sun: 'text-sun-ink',
  sprout: 'text-sprout-ink',
}
</script>

<template>
  <div class="flex flex-1 flex-col rounded-md bg-canvas px-3 py-2.5">
    <span class="text-caption font-normal text-ink-subtle">{{ label }}</span>
    <span
      :class="[
        toneClasses[tone],
        large
          ? 'font-display text-[22px] leading-7 font-semibold'
          : 'text-[15px] leading-5.5 font-[650]',
      ]"
    >
      {{ value }}
    </span>
  </div>
</template>
