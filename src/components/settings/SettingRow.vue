<script setup lang="ts">
const { name, description } = defineProps<{
  name: string
  /** One line on what it does, or why it helps. */
  description: string
}>()
</script>

<!-- One preference in a card: what it is on the left, its control on the right (or below). -->
<template>
  <div
    class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line py-3.5 first:border-t-0 first:pt-0 last:pb-0"
  >
    <div class="flex max-w-130 flex-col gap-0.5">
      <b class="text-[15px] leading-5 font-[650] text-ink">{{ name }}</b>
      <span class="text-label font-normal text-ink-muted">{{ description }}</span>
    </div>
    <slot />
  </div>
</template>
