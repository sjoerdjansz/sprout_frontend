<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import FilterChip from '@/components/FilterChip.vue'
import type { Category } from '@/stores/topics'

const { categories, attentionCount } = defineProps<{
  /** The categories to offer as filter chips. */
  categories: Category[]
  /** How many subtopics have cards due or are slipping. */
  attentionCount: number
}>()

const query = defineModel<string>('query', { required: true })
const categoryId = defineModel<number | 'all'>('categoryId', { required: true })
const needsAttention = defineModel<boolean>('needsAttention', { required: true })

const emit = defineEmits<{
  addTopic: []
}>()
</script>

<template>
  <div class="flex flex-none flex-col gap-2.5 border-b border-line px-4 pt-3.5 pb-3">
    <div class="flex items-center gap-2.5">
      <label
        class="flex h-11 min-w-0 flex-auto items-center gap-2.5 rounded-full border border-transparent bg-surface-sunken pr-2 pl-4 text-ink-subtle transition duration-150 ease-default focus-within:border-focus focus-within:bg-surface focus-within:shadow-focus-ring"
      >
        <BaseIcon name="search" :size="18" />
        <input
          v-model="query"
          type="search"
          aria-label="Search topics"
          placeholder="Search topics…"
          class="min-w-0 flex-auto bg-transparent text-body text-ink outline-none placeholder:text-ink-subtle focus-visible:shadow-none [&::-webkit-search-cancel-button]:hidden"
          data-test="search"
        />
        <BaseIconButton
          v-if="query !== ''"
          icon="x"
          label="Clear search"
          size="sm"
          data-test="clear-search"
          @click="query = ''"
        />
      </label>
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
  </div>
</template>
