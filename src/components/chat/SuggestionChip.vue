<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

const { label, icon } = defineProps<{
  label: string
  icon?: IconName
}>()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-canvas px-3 text-label text-ink-muted transition-colors duration-150 ease-default hover:border-transparent hover:bg-sprout-soft hover:text-sprout-ink disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line disabled:hover:bg-canvas disabled:hover:text-ink-muted"
  >
    <BaseIcon v-if="icon" :name="icon" :size="15" />
    {{ label }}
  </button>
</template>
