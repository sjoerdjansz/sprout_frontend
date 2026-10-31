<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import OptionCard from '@/components/OptionCard.vue'
import { themeOptions } from '@/lib/settingsOptions'
import type { ThemePreference } from '@/stores/settings'

const theme = defineModel<ThemePreference>({ required: true })

// A small picture of each theme, drawn in the brand palette so it looks the same in either theme.
const swatchClasses: Record<ThemePreference, string> = {
  light: 'bg-cream',
  dark: 'bg-onyx',
  system: 'bg-linear-to-r from-cream from-50% to-onyx to-50%',
}

const accentClasses: Record<ThemePreference, string> = {
  light: 'bg-deep-forest',
  dark: 'bg-muted-teal',
  system: 'bg-deep-forest',
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-2.5">
    <OptionCard
      v-for="option in themeOptions"
      :key="option.id"
      layout="stacked"
      :pressed="theme === option.id"
      :data-test="`theme-${option.id}`"
      @toggle="theme = option.id"
    >
      <span
        aria-hidden="true"
        class="flex h-16 w-full items-end gap-1 rounded-sm border border-line p-2"
        :class="swatchClasses[option.id]"
      >
        <span class="h-2 w-7 rounded-full" :class="accentClasses[option.id]" />
        <span class="h-2 w-4 rounded-full bg-sunbeam" />
      </span>
      <span class="flex items-center gap-2 text-[15px] font-[650]">
        <BaseIcon :name="option.icon" :size="16" />
        {{ option.name }}
      </span>
    </OptionCard>
  </div>
</template>
