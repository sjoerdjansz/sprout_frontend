<script setup lang="ts">
import { useId } from 'vue'

const { title, subtitle } = defineProps<{
  title: string
  /** One line under the title: what this group is for. */
  subtitle?: string
}>()

const headingId = useId()
</script>

<!-- One group of settings on a section's page, like the artboard's cards. -->
<template>
  <section
    :aria-labelledby="headingId"
    class="flex flex-col gap-4.5 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <div class="flex flex-col gap-0.5">
        <h2 :id="headingId" class="font-display text-title text-ink">{{ title }}</h2>
        <p v-if="subtitle" class="text-label font-normal text-ink-subtle">{{ subtitle }}</p>
      </div>
      <!-- Something small on the right, like the month of the usage. -->
      <slot name="aside" />
    </div>

    <slot />
  </section>
</template>
