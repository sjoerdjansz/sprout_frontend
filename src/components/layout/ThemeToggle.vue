<script setup lang="ts">
import { computed } from 'vue'
import SidebarButton from '@/components/layout/SidebarButton.vue'
import { useThemeStore } from '@/stores/theme'

const { collapsed = false } = defineProps<{
  collapsed?: boolean
}>()

const themeStore = useThemeStore()

// The icon and label show where you'll go.
const isDark = computed<boolean>(() => themeStore.theme === 'dark')
</script>

<template>
  <SidebarButton
    :icon="isDark ? 'sun' : 'moon'"
    :label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :collapsed="collapsed"
    data-test="theme-toggle"
    @click="themeStore.toggleTheme()"
  />
</template>
