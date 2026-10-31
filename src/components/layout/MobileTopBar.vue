<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseIconButton from '@/components/BaseIconButton.vue'
import SproutLogo from '@/components/SproutLogo.vue'

const { menuOpen } = defineProps<{
  menuOpen: boolean
}>()

const emit = defineEmits<{
  openMenu: []
}>()
</script>

<template>
  <!-- At phone width this takes the sidebar's place: the menu opens the navigation drawer. -->
  <header class="flex items-center gap-2 bg-canvas px-3 pt-3 pb-2">
    <BaseIconButton
      icon="menu"
      label="Open menu"
      :aria-expanded="menuOpen"
      class="size-11"
      data-test="open-menu"
      @click="emit('openMenu')"
    />
    <RouterLink :to="{ name: 'home' }" class="rounded-sm">
      <SproutLogo />
    </RouterLink>
  </header>
</template>
