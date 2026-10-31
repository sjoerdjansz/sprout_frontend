<script setup lang="ts">
const { step, title, headingId } = defineProps<{
  step: number
  title: string
  headingId: string
}>()
</script>

<template>
  <section
    :aria-labelledby="headingId"
    class="flex flex-col gap-3.5 rounded-xl border border-line bg-surface p-4 shadow-sm sm:px-6 sm:py-5"
  >
    <div class="flex flex-col gap-0.5">
      <span class="text-overline text-ink-subtle">STEP {{ step }}</span>
      <h2 :id="headingId" class="font-display text-title text-ink">{{ title }}</h2>
    </div>
    <slot />
  </section>
</template>
