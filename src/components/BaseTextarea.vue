<script setup lang="ts">
import { useId } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'

// Native attributes (rows, placeholder, data-test ...) belong on the <textarea>, not the wrapper.
defineOptions({ inheritAttrs: false })

const {
  label,
  error,
  hideLabel = false,
} = defineProps<{
  label: string
  /** For screen readers only, when the label is shown next to other controls. */
  hideLabel?: boolean
  /** Says what to do next; turns the border ember. */
  error?: string
}>()

const model = defineModel<string>({ required: true })

const textareaId = useId()
const errorId = `${textareaId}-error`
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label :for="textareaId" class="text-label text-ink" :class="{ 'sr-only': hideLabel }">{{
      label
    }}</label>

    <textarea
      :id="textareaId"
      v-model="model"
      class="min-h-24 w-full resize-y rounded-md border bg-surface-sunken px-4 py-3 text-body text-ink transition duration-150 ease-default outline-none placeholder:text-ink-subtle focus:border-focus focus:bg-surface focus:shadow-focus-ring"
      :class="error ? 'border-ember' : 'border-line-strong'"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      v-bind="$attrs"
    />

    <p v-if="error" :id="errorId" class="flex items-center gap-1 text-caption text-ember-ink">
      <BaseIcon name="circle-help" :size="14" />
      {{ error }}
    </p>
  </div>
</template>
