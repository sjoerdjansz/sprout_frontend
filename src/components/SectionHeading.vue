<script setup lang="ts">
const { title, headingId, subtitle } = defineProps<{
  title: string
  /** Lets the surrounding section point at this heading with `aria-labelledby`. */
  headingId: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex items-baseline justify-between gap-3">
    <div class="flex flex-col gap-0.5">
      <h2 :id="headingId" class="font-display text-title text-ink">{{ title }}</h2>
      <p v-if="subtitle" class="text-label font-normal text-ink-subtle">{{ subtitle }}</p>
    </div>

    <!-- Something small on the right: a link or a badge. -->
    <slot />
  </div>
</template>
