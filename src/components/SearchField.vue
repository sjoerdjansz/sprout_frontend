<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'

const { label } = defineProps<{
  /** Read by screen readers and shown as the placeholder ("Search topics…"). */
  label: string
}>()

const query = defineModel<string>({ required: true })
</script>

<template>
  <label
    class="flex h-11 min-w-0 items-center gap-2.5 rounded-full border border-transparent bg-surface-sunken pr-2 pl-4 text-ink-subtle transition duration-150 ease-default focus-within:border-focus focus-within:bg-surface focus-within:shadow-focus-ring"
  >
    <BaseIcon name="search" :size="18" />
    <input
      v-model="query"
      type="search"
      :aria-label="label"
      :placeholder="`${label}…`"
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
</template>
