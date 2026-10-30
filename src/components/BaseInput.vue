<script setup lang="ts">
import { useId } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

// Native attributes (type, placeholder, autocomplete, data-test ...) belong on the <input>, not the wrapper.
defineOptions({ inheritAttrs: false })

const { label, icon, hint, error } = defineProps<{
  label: string
  icon?: IconName
  /** Helper text under the field; an error replaces it. */
  hint?: string
  /** Says what to do next ("Add your email ..."); turns the border ember. */
  error?: string
}>()

const model = defineModel<string>({ required: true })

const inputId = useId()
const errorId = `${inputId}-error`
const hintId = `${inputId}-hint`
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label :for="inputId" class="text-label text-ink">{{ label }}</label>

    <div
      class="flex min-h-11.5 items-center gap-2 rounded-md border bg-surface-sunken pr-2 pl-4 text-ink-muted transition duration-150 ease-default focus-within:border-focus focus-within:bg-surface focus-within:shadow-focus-ring"
      :class="error ? 'border-ember' : 'border-line-strong'"
    >
      <BaseIcon v-if="icon" :name="icon" :size="18" />
      <input
        :id="inputId"
        v-model="model"
        class="min-w-0 flex-1 bg-transparent py-3 text-body text-ink outline-none placeholder:text-ink-subtle focus-visible:shadow-none"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        v-bind="$attrs"
      />
    </div>

    <p v-if="error" :id="errorId" class="flex items-center gap-1 text-caption text-ember-ink">
      <BaseIcon name="circle-help" :size="14" />
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="text-caption text-ink-subtle">{{ hint }}</p>
  </div>
</template>
