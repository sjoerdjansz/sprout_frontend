<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import FilterChip from '@/components/FilterChip.vue'
import type { Category } from '@/stores/topics'

const { categories, attentionCount } = defineProps<{
  /** The categories to offer as filter chips. */
  categories: Category[]
  /** How many subtopics have cards due or are slipping. */
  attentionCount: number
}>()

const categoryId = defineModel<number | 'all'>('categoryId', { required: true })
const needsAttention = defineModel<boolean>('needsAttention', { required: true })

const emit = defineEmits<{
  addTopic: []
}>()
</script>

<template>
  <div
    class="flex flex-none flex-wrap items-center justify-between gap-2.5 border-b border-line px-4 py-3"
  >
    <div role="group" aria-label="Filter" class="flex flex-wrap items-center gap-2">
      <FilterChip
        :pressed="categoryId === 'all'"
        data-test="category-all"
        @click="categoryId = 'all'"
      >
        All
      </FilterChip>
      <FilterChip
        v-for="category in categories"
        :key="category.id"
        :pressed="categoryId === category.id"
        data-test="category-chip"
        @click="categoryId = category.id"
      >
        {{ category.name }}
      </FilterChip>
      <span aria-hidden="true" class="mx-1 h-5 w-px bg-line" />
      <FilterChip
        :pressed="needsAttention"
        tone="sun"
        icon="trending-down"
        data-test="needs-attention"
        @click="needsAttention = !needsAttention"
      >
        Needs attention · {{ attentionCount }}
      </FilterChip>
    </div>
    <BaseButton
      variant="ghost"
      size="md"
      icon="plus"
      data-test="add-topic"
      @click="emit('addTopic')"
    >
      Add topic
    </BaseButton>
  </div>
</template>
