<script setup lang="ts">
import { useRouter } from 'vue-router'
import SectionHeading from '@/components/SectionHeading.vue'
import TextLink from '@/components/TextLink.vue'
import PracticeModeCard from '@/components/dashboard/PracticeModeCard.vue'
import { practiceModes, type PracticeModeId } from '@/lib/practiceModes'

const router = useRouter()

// A card opens the practice setup with that mode picked; you choose what to practise there.
function practise(mode: PracticeModeId): void {
  void router.push({ name: 'practice', query: { modes: mode } })
}
</script>

<template>
  <section aria-labelledby="practice-heading" class="flex flex-col gap-4">
    <SectionHeading title="Start a practice session" heading-id="practice-heading">
      <TextLink :to="{ name: 'practice' }" data-test="practice-center"
        >Open practice center</TextLink
      >
    </SectionHeading>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-4">
      <PracticeModeCard
        v-for="mode in practiceModes"
        :key="mode.id"
        :mode="mode"
        :data-test="`practice-mode-${mode.id}`"
        @click="practise(mode.id)"
      />
    </div>
  </section>
</template>
