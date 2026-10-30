<script setup lang="ts">
import { computed } from 'vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// The icon shows where you'll go, matching the label.
const isDark = computed<boolean>(() => themeStore.theme === 'dark')
</script>

<template>
  <BaseIconButton
    :icon="isDark ? 'sun' : 'moon'"
    :label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    data-test="theme-toggle"
    @click="themeStore.toggleTheme()"
  />
</template>
