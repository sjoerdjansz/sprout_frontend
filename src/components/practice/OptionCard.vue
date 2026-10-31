<script setup lang="ts">
const { pressed, disabled = false } = defineProps<{
  pressed: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<!-- A choice on the setup page: a bordered row that turns tinted with a primary border when on. -->
<template>
  <button
    type="button"
    class="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border-[1.5px] px-3.5 py-3 text-left text-ink transition-colors duration-150 ease-default focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
    :class="
      pressed ? 'border-primary bg-surface-tint' : 'border-line bg-surface hover:border-line-strong'
    "
    :aria-pressed="pressed"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    <slot />
  </button>
</template>
