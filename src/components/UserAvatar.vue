<script setup lang="ts">
const { initials } = defineProps<{
  initials: string
}>()
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-grid size-7 flex-none place-items-center rounded-full bg-sun text-caption font-bold text-on-sun"
  >
    {{ initials }}
  </span>
</template>
