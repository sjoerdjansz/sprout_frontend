<script setup lang="ts">
import { useId } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'

export interface SelectOption {
  value: string
  label: string
}

// Native attributes (data-test ...) belong on the <select>, not the wrapper.
defineOptions({ inheritAttrs: false })

const {
  label,
  options,
  error,
  hideLabel = false,
} = defineProps<{
  label: string
  /** For a select in a row that already names it: the label is then for screen readers only. */
  hideLabel?: boolean
  options: SelectOption[]
  /** Says what to do next; turns the border ember. */
  error?: string
}>()

const model = defineModel<string>({ required: true })

const selectId = useId()
const errorId = `${selectId}-error`
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label :for="selectId" class="text-label text-ink" :class="{ 'sr-only': hideLabel }">{{
      label
    }}</label>

    <select
      :id="selectId"
      v-model="model"
      class="h-11.5 w-full cursor-pointer rounded-md border bg-surface-sunken px-3.5 text-body text-ink transition duration-150 ease-default outline-none focus:border-focus focus:bg-surface focus:shadow-focus-ring"
      :class="error ? 'border-ember' : 'border-line-strong'"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      v-bind="$attrs"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <p v-if="error" :id="errorId" class="flex items-center gap-1 text-caption text-ember-ink">
      <BaseIcon name="circle-help" :size="14" />
      {{ error }}
    </p>
  </div>
</template>
