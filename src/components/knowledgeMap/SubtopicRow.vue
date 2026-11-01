<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import FacetDots from '@/components/knowledgeMap/FacetDots.vue'
import ItemMenu from '@/components/knowledgeMap/ItemMenu.vue'
import { subtopicCaption, type Caption } from '@/lib/knowledgeMap'
import type { Subtopic } from '@/stores/topics'

const { subtopic } = defineProps<{
  subtopic: Subtopic
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const caption = computed<Caption>(() => subtopicCaption(subtopic))

const captionClasses: Record<Caption['tone'], string> = {
  subtle: 'text-ink-subtle',
  sun: 'text-sun-ink',
  sprout: 'text-sprout-ink',
  sky: 'text-sky-ink',
  ember: 'text-ember-ink',
}
</script>

<template>
  <!-- The row opens the subtopic's page, where you see and practise everything about it. The menu
       sits beside the link rather than in it (a link can't hold a button); the hover covers both,
       and while the menu is open the row stacks above the ones below. -->
  <li
    class="relative flex items-center rounded-md pr-1.5 transition-colors duration-150 ease-default focus-within:z-10 hover:bg-surface-sunken"
  >
    <RouterLink
      :to="{ name: 'subtopic', params: { id: subtopic.id } }"
      class="flex min-w-0 grow flex-wrap items-center gap-3.5 rounded-md py-2.25 pr-2 pl-3.5"
      data-test="subtopic"
    >
      <span class="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <span class="text-[15px] leading-5 font-[650] text-ink" data-test="subtopic-title">
          {{ subtopic.title }}
        </span>
        <span
          class="text-caption font-normal"
          :class="captionClasses[caption.tone]"
          data-test="subtopic-caption"
        >
          {{ caption.text }}
        </span>
      </span>
      <FacetDots :subtopic="subtopic" />
      <span class="w-11 text-right font-display text-base font-semibold text-ink">
        {{ subtopic.mastery }}%
      </span>
    </RouterLink>
    <ItemMenu
      kind="subtopic"
      :title="subtopic.title"
      @edit="emit('edit')"
      @delete="emit('delete')"
    />
  </li>
</template>
