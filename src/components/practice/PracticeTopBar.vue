<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SproutLogo from '@/components/SproutLogo.vue'

const { title } = defineProps<{
  /** Shown in the middle on wider screens ("Set up a practice session"). */
  title?: string
}>()
</script>

<!-- A running practice session leaves the sidebar out, so you can focus; the logo goes home. -->
<template>
  <header
    class="flex flex-none items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3 sm:px-8"
  >
    <RouterLink :to="{ name: 'home' }" class="rounded-sm focus-visible:shadow-focus-ring">
      <SproutLogo />
    </RouterLink>
    <span v-if="title" class="hidden text-label text-ink-muted sm:inline">{{ title }}</span>
    <slot />
  </header>
</template>
