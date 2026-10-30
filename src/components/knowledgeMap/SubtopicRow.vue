<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import FacetDots from '@/components/knowledgeMap/FacetDots.vue'
import { subtopicCaption, type Caption } from '@/lib/knowledgeMap'
import type { Subtopic } from '@/stores/topics'

const { subtopic } = defineProps<{
  subtopic: Subtopic
}>()

const caption = computed<Caption>(() => subtopicCaption(subtopic))

const captionClasses: Record<Caption['tone'], string> = {
  subtle: 'text-ink-subtle',
  sun: 'text-sun-ink',
  sprout: 'text-sprout-ink',
}
</script>

<template>
  <!-- The whole row opens the subtopic's page, where you see and practise everything about it. -->
  <li>
    <RouterLink
      :to="{ name: 'subtopic', params: { id: subtopic.id } }"
      class="flex flex-wrap items-center gap-3.5 rounded-md py-2.25 pr-3 pl-3.5 transition-colors duration-150 ease-default hover:bg-surface-sunken"
      data-test="subtopic"
    >
      <span class="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <span class="text-[15px] leading-5 font-[650] text-ink" data-test="subtopic-title">
          {{ subtopic.title }}
        </span>
        <span class="text-caption font-normal" :class="captionClasses[caption.tone]">
          {{ caption.text }}
        </span>
      </span>
      <FacetDots :subtopic="subtopic" />
      <span class="w-11 text-right font-display text-base font-semibold text-ink">
        {{ subtopic.mastery }}%
      </span>
      <BaseIcon name="chevron-right" :size="18" class="text-ink-subtle" />
    </RouterLink>
  </li>
</template>
