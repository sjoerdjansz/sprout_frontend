<script setup lang="ts">
const { label } = defineProps<{
  label: string
}>()

const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="inline-flex min-h-11 cursor-pointer items-center gap-3 text-body text-ink">
    <button
      type="button"
      role="switch"
      :aria-checked="checked"
      class="relative h-6.5 w-11 flex-none cursor-pointer rounded-full border transition-colors duration-200"
      :class="checked ? 'border-primary bg-primary' : 'border-line-strong bg-surface-sunken'"
      @click="checked = !checked"
    >
      <span
        class="absolute top-0.75 left-0.75 size-4.5 rounded-full shadow-xs transition duration-250 ease-spring motion-reduce:transition-none"
        :class="checked ? 'translate-x-4.5 bg-on-primary' : 'bg-ink-subtle'"
      />
    </button>
    <span>{{ label }}</span>
  </label>
</template>
