<script setup lang="ts">
import { computed } from 'vue'
import ProgressRing from '@/components/ProgressRing.vue'
import TopicMenu from '@/components/knowledgeMap/TopicMenu.vue'
import { averageMastery, dueCards, pluralize } from '@/lib/knowledgeMap'
import type { Topic } from '@/stores/topics'

const { topic, selected } = defineProps<{
  topic: Topic
  selected: boolean
}>()

const emit = defineEmits<{
  select: []
  edit: []
  delete: []
}>()

const mastery = computed<number>(() => averageMastery(topic))
const due = computed<number>(() => dueCards(topic))
</script>

<template>
  <!-- The menu sits beside the card's button rather than in it: a button can't hold another one.
       While the menu is open (focus is in it), the card stacks above its neighbours. -->
  <div
    class="relative rounded-lg border shadow-sm transition duration-200 ease-default focus-within:z-10 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
    :class="selected ? 'border-primary bg-surface-tint' : 'border-line bg-surface'"
  >
    <button
      type="button"
      :aria-pressed="selected"
      class="flex h-full w-full cursor-pointer flex-col gap-3.5 rounded-lg p-4 text-left"
      data-test="topic-card"
      @click="emit('select')"
    >
      <!-- Room on the right for the menu button. -->
      <span class="flex items-center justify-between gap-3">
        <!--    We'll decice if we want this later    -->
        <!--          <IconTile :icon="appearance.icon" :tint="appearance.tint" />-->
        <ProgressRing :value="mastery" :size="48" :label="`${topic.title} mastery ${mastery}%`" />
        <TopicMenu :topic-title="topic.title" @edit="emit('edit')" @delete="emit('delete')" />
      </span>
      <span class="flex flex-col gap-0.75">
        <span class="font-display text-[19px] leading-6 font-semibold tracking-[-0.015em] text-ink">
          {{ topic.title }}
        </span>
        <!-- One line of text, so a long due count wraps with it instead of jumping to its own line. -->
        <span class="text-label font-normal text-ink-muted" data-test="topic-meta">
          {{ topic.category.name }} · {{ pluralize(topic.subtopics.length, 'subtopic') }}
          <span v-if="due > 0" class="font-[650] whitespace-nowrap text-sun-ink"
            >· {{ pluralize(due, 'card') }} due</span
          >
        </span>
      </span>
    </button>
  </div>
</template>
