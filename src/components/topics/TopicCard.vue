<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ProgressRing from '@/components/ProgressRing.vue'
import ItemMenu from '@/components/topics/ItemMenu.vue'
import { averageMastery, dueCards, pluralize } from '@/lib/topics'
import type { Topic } from '@/stores/topics'

const { topic } = defineProps<{
  topic: Topic
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const mastery = computed<number>(() => averageMastery(topic))
const due = computed<number>(() => dueCards(topic))
// Starts with its comma, so it sits right after the subtopic count: "4 subtopics, 9 cards due".
const dueLabel = computed<string>(() => `, ${pluralize(due.value, 'card')} due`)
</script>

<template>
  <!-- The card opens the topic's page. The menu sits beside the link rather than in it: a link
       can't hold a button. While the menu is open (focus is in it), the card stacks above its
       neighbours. -->
  <div
    class="relative rounded-lg border border-line bg-surface shadow-sm transition duration-200 ease-default focus-within:z-10 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
  >
    <RouterLink
      :to="{ name: 'topic', params: { id: topic.id } }"
      class="flex h-full w-full flex-col gap-3.5 rounded-lg p-4 text-left"
      data-test="topic-card"
    >
      <!-- Room on the right for the menu button. -->
      <span class="flex items-center justify-between gap-3">
        <!--    We'll decice if we want this later    -->
        <!--          <IconTile :icon="appearance.icon" :tint="appearance.tint" />-->
        <ProgressRing :value="mastery" :size="48" :label="`${topic.title} mastery ${mastery}%`" />
      </span>
      <span class="flex flex-col gap-0.75">
        <span class="text-overline text-ink-subtle uppercase" data-test="topic-category">
          {{ topic.category.name }}
        </span>
        <span class="font-display text-[19px] leading-6 font-semibold tracking-[-0.015em] text-ink">
          {{ topic.title }}
        </span>
        <!-- One line of text, so a long due count wraps with it instead of jumping to its own line. -->
        <span class="text-label font-normal text-ink-muted" data-test="topic-meta">
          {{ pluralize(topic.subtopics.length, 'subtopic')
          }}<span v-if="due > 0" class="font-[650] whitespace-nowrap text-sun-ink">{{
            dueLabel
          }}</span>
        </span>
      </span>
    </RouterLink>
    <!-- Top right, level with the mastery ring. -->
    <div class="absolute top-5 right-4">
      <ItemMenu kind="topic" :title="topic.title" @edit="emit('edit')" @delete="emit('delete')" />
    </div>
  </div>
</template>
