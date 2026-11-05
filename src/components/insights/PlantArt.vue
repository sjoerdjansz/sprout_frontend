<script setup lang="ts">
import { computed } from 'vue'

const { stageIndex, label } = defineProps<{
  /** 0 (seed) to 3 (tree): each stage adds a pair of leaves, the last one the sun. */
  stageIndex: number
  /** "Your plant is a sprout" */
  label: string
}>()

// The stem grows a step per stage; leaves not grown yet stay as faint outlines of what's coming.
const stemTop = computed<number>(() => 120 - 24 * (stageIndex + 1))
const stemHeight = computed<number>(() => 24 * (stageIndex + 1) + 6)

function grownOpacity(fromStage: number): number {
  return stageIndex >= fromStage ? 1 : 0.18
}
</script>

<template>
  <svg
    viewBox="0 0 120 140"
    width="120"
    height="140"
    role="img"
    :aria-label="label"
    class="flex-none"
  >
    <ellipse cx="60" cy="126" rx="40" ry="8" class="fill-sprout-soft" />
    <rect x="57" :y="stemTop" width="6" :height="stemHeight" rx="3" class="fill-primary" />
    <g transform="translate(60,96)">
      <path d="M0 0 A 22 22 0 0 0 -22 -22 A 22 22 0 0 0 0 0 Z" class="fill-sprout" />
      <path d="M0 0 A 22 22 0 0 1 22 -22 A 22 22 0 0 1 0 0 Z" class="fill-primary" />
    </g>
    <g transform="translate(60,70)" :opacity="grownOpacity(1)">
      <path d="M0 0 A 18 18 0 0 0 -18 -18 A 18 18 0 0 0 0 0 Z" class="fill-primary" />
      <path d="M0 0 A 18 18 0 0 1 18 -18 A 18 18 0 0 1 0 0 Z" class="fill-sprout" />
    </g>
    <g transform="translate(60,46)" :opacity="grownOpacity(2)">
      <path d="M0 0 A 14 14 0 0 0 -14 -14 A 14 14 0 0 0 0 0 Z" class="fill-sprout" />
      <path d="M0 0 A 14 14 0 0 1 14 -14 A 14 14 0 0 1 0 0 Z" class="fill-primary" />
    </g>
    <circle cx="60" cy="22" r="11" class="fill-sun" :opacity="grownOpacity(3)" />
  </svg>
</template>
