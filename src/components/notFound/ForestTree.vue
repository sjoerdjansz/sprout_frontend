<script setup lang="ts">
/** One pair of leaves on the trunk, `at` px above its foot. */
export interface TreeLeaves {
  at: number
  size: number
  leftFill: string
  rightFill: string
}

const {
  trunkHeight,
  trunkWidth = 5,
  trunkFill,
  leaves,
} = defineProps<{
  trunkHeight: number
  trunkWidth?: number
  trunkFill: string
  leaves: TreeLeaves[]
}>()

// A leaf is a quarter-circle lens from the stem up and out, the same shape as the logo's leaves.
function leftLeafPath(size: number): string {
  return `M0 0 A ${size} ${size} 0 0 0 -${size} -${size} A ${size} ${size} 0 0 0 0 0 Z`
}

function rightLeafPath(size: number): string {
  return `M0 0 A ${size} ${size} 0 0 1 ${size} -${size} A ${size} ${size} 0 0 1 0 0 Z`
}
</script>

<template>
  <!-- An SVG group with its foot at (0, 0); place it with a transform on a parent group. -->
  <g>
    <rect
      :x="-trunkWidth / 2"
      :y="-trunkHeight"
      :width="trunkWidth"
      :height="trunkHeight"
      :rx="trunkWidth / 2"
      :class="trunkFill"
    />
    <g v-for="pair in leaves" :key="pair.at" :transform="`translate(0,-${pair.at})`">
      <path :d="leftLeafPath(pair.size)" :class="pair.leftFill" />
      <path :d="rightLeafPath(pair.size)" :class="pair.rightFill" />
    </g>
  </g>
</template>
