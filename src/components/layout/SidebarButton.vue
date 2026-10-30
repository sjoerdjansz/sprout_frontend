<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

const {
  icon,
  label,
  collapsed = false,
} = defineProps<{
  icon: IconName
  label: string
  /** Icon only; the label stays for screen readers and shows as a tooltip. */
  collapsed?: boolean
}>()
</script>

<template>
  <!-- An action in the sidebar (log out, theme), styled like the navigation links above it. -->
  <button
    type="button"
    :title="collapsed ? label : undefined"
    class="flex h-11 w-full cursor-pointer items-center gap-3 rounded-md text-left text-body-strong text-ink-muted transition-colors duration-150 ease-default hover:bg-surface hover:text-ink"
    :class="collapsed ? 'justify-center px-0' : 'px-3'"
  >
    <BaseIcon :name="icon" />
    <span :class="{ 'sr-only': collapsed }">{{ label }}</span>
  </button>
</template>
