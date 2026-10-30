<script setup lang="ts">
import { computed } from 'vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import FacetDots from '@/components/knowledgeMap/FacetDots.vue'
import { subtopicCaption, type Caption } from '@/lib/knowledgeMap'
import type { Subtopic } from '@/stores/topics'

const { subtopic, selected } = defineProps<{
  subtopic: Subtopic
  selected: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const caption = computed<Caption>(() => subtopicCaption(subtopic))

const captionClasses: Record<Caption['tone'], string> = {
  subtle: 'text-ink-subtle',
  sun: 'text-sun-ink',
  sprout: 'text-sprout-ink',
}
</script>

<template>
  <li
    class="flex flex-none flex-wrap items-center gap-3.5 rounded-md py-2.25 pr-2 pl-3.5 transition-colors duration-150 ease-default"
    :class="selected ? 'bg-surface-tint' : 'hover:bg-surface-sunken'"
  >
    <button
      type="button"
      :aria-pressed="selected"
      class="flex min-w-0 flex-[1_1_200px] cursor-pointer flex-col gap-0.5 rounded-sm text-left"
      data-test="subtopic"
      @click="emit('select')"
    >
      <span class="text-[15px] leading-5 font-[650] text-ink">{{ subtopic.title }}</span>
      <span class="text-caption font-normal" :class="captionClasses[caption.tone]">
        {{ caption.text }}
      </span>
    </button>
    <FacetDots :subtopic="subtopic" />
    <span class="w-11 text-right font-display text-base font-semibold text-ink">
      {{ subtopic.mastery }}%
    </span>
    <BaseIconButton
      icon="chevron-right"
      :label="`Show ${subtopic.title}`"
      size="sm"
      @click="emit('select')"
    />
  </li>
</template>
