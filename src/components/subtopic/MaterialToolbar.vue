<script setup lang="ts" generic="FilterId extends string">
import FilterChip from '@/components/FilterChip.vue'
import SearchField from '@/components/SearchField.vue'

const { searchLabel, filters = [] } = defineProps<{
  /** "Search cards" */
  searchLabel: string
  /** The filter chips; leave out for a tab without filters. */
  filters?: { id: FilterId; label: string }[]
}>()

const query = defineModel<string>('query', { required: true })
const filter = defineModel<FilterId>('filter')
</script>

<template>
  <div class="flex flex-none flex-wrap items-center gap-2.5 border-b border-line px-4 py-3">
    <SearchField v-model="query" :label="searchLabel" class="max-w-90 min-w-0 flex-[1_1_220px]" />

    <div v-if="filters.length > 0" role="group" aria-label="Filter" class="flex flex-wrap gap-1.5">
      <FilterChip
        v-for="option in filters"
        :key="option.id"
        :pressed="filter === option.id"
        :data-test="`filter-${option.id}`"
        @click="filter = option.id"
      >
        {{ option.label }}
      </FilterChip>
    </div>

    <div class="flex flex-auto flex-wrap justify-end gap-1.5">
      <slot />
    </div>
  </div>
</template>
