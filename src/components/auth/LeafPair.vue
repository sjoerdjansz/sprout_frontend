<script setup lang="ts">
/** The brand's two-leaf shape, used as decoration on the auth screens. Pass `fill-*` classes. */
const { width, leftLeaf, rightLeaf } = defineProps<{
  width: number
  leftLeaf: string
  rightLeaf: string
}>()
</script>

<template>
  <svg :width="width" :height="width / 2" viewBox="0 0 64 32" aria-hidden="true">
    <path :class="leftLeaf" d="M32 32A32 32 0 0 1 0 0A32 32 0 0 1 32 32Z" />
    <path :class="rightLeaf" d="M32 32A32 32 0 0 1 64 0A32 32 0 0 1 32 32Z" />
  </svg>
</template>
