<script setup lang="ts">
import FilterChip from '@/components/FilterChip.vue'
import SearchField from '@/components/SearchField.vue'
import { subtopicFilters, type SubtopicFilter } from '@/lib/topics'

const { counts } = defineProps<{
  /** How many subtopics each chip would show. */
  counts: Record<SubtopicFilter, number>
}>()

const query = defineModel<string>('query', { required: true })
const filter = defineModel<SubtopicFilter>('filter', { required: true })
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2.5">
    <SearchField
      v-model="query"
      label="Search subtopics"
      class="max-w-90 min-w-0 flex-[1_1_260px]"
    />
    <!-- One row that scrolls sideways at phone width, so the chips never wrap under each other. -->
    <div role="group" aria-label="Show" class="flex items-center gap-2 overflow-x-auto">
      <FilterChip
        v-for="option in subtopicFilters"
        :key="option.key"
        :pressed="filter === option.key"
        class="flex-none"
        :data-test="`filter-${option.key}`"
        @click="filter = option.key"
      >
        {{ option.label }}
        <span
          class="inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold"
          :class="
            filter === option.key
              ? 'bg-on-primary text-primary'
              : 'bg-surface-sunken text-ink-muted'
          "
        >
          {{ counts[option.key] }}
        </span>
      </FilterChip>
    </div>
  </div>
</template>
