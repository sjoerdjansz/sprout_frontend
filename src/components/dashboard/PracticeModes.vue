<script setup lang="ts">
import SectionHeading from '@/components/SectionHeading.vue'
import TextLink from '@/components/TextLink.vue'
import PracticeModeCard, { type PracticeMode } from '@/components/dashboard/PracticeModeCard.vue'

const { modes } = defineProps<{
  modes: PracticeMode[]
}>()
</script>

<template>
  <section aria-labelledby="practice-heading" class="flex flex-col gap-4">
    <SectionHeading title="Start a practice session" heading-id="practice-heading">
      <TextLink>Open practice center</TextLink>
    </SectionHeading>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
      <PracticeModeCard v-for="mode in modes" :key="mode.title" :mode="mode" />
    </div>
  </section>
</template>
