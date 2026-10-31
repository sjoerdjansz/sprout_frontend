<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import type { SettingsSection } from '@/lib/settingsOptions'

const { sections } = defineProps<{
  sections: SettingsSection[]
}>()

const emit = defineEmits<{
  logout: []
}>()

const itemClasses =
  'flex h-10.5 flex-none items-center gap-2.5 rounded-md px-3 text-label whitespace-nowrap text-ink-muted transition-colors duration-150 ease-default hover:bg-surface-sunken hover:text-ink'
</script>

<!-- A row that scrolls sideways on narrow screens, a column next to the section from `md`. -->
<template>
  <nav
    aria-label="Settings sections"
    class="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
  >
    <RouterLink
      v-for="section in sections"
      :key="section.id"
      :to="{ name: section.routeName }"
      :class="itemClasses"
      exact-active-class="bg-surface text-ink shadow-sm"
      :data-test="`settings-section-${section.id}`"
    >
      <BaseIcon :name="section.icon" :size="18" />
      {{ section.label }}
    </RouterLink>

    <div class="hidden grow md:block" />
    <button
      type="button"
      :class="[itemClasses, 'cursor-pointer md:mt-6']"
      data-test="settings-logout"
      @click="emit('logout')"
    >
      <BaseIcon name="log-out" :size="18" />
      Log out
    </button>
  </nav>
</template>
