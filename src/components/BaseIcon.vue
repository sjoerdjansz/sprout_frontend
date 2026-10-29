<script setup lang="ts">
import { icons, type IconName } from '@/components/icons'

const {
  name,
  size = 20,
  label,
} = defineProps<{
  name: IconName
  size?: number
  /** Accessible text, only when the icon stands alone and carries meaning. */
  label?: string
}>()
</script>

<template>
  <!-- The markup is our own static icon data, never user input. -->
  <!-- eslint-disable vue/no-v-html -->
  <svg
    class="inline-block flex-none align-middle"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    v-html="icons[name]"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
