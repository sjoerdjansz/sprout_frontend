<script setup lang="ts">
import { useId } from 'vue'

export interface SelectOption {
  value: string
  label: string
}

// Native attributes (data-test ...) belong on the <select>, not the wrapper.
defineOptions({ inheritAttrs: false })

const { label, options } = defineProps<{
  label: string
  options: SelectOption[]
}>()

const model = defineModel<string>({ required: true })

const selectId = useId()
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label :for="selectId" class="text-label text-ink">{{ label }}</label>

    <select
      :id="selectId"
      v-model="model"
      class="h-11.5 w-full cursor-pointer rounded-md border border-line-strong bg-surface-sunken px-3.5 text-body text-ink transition duration-150 ease-default outline-none focus:border-focus focus:bg-surface focus:shadow-focus-ring"
      v-bind="$attrs"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
