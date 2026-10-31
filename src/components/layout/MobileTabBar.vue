<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

interface Tab {
  icon: IconName
  label: string
  /** Left out while the page doesn't exist yet: the tab then does nothing, as in the sidebar. */
  to?: RouteLocationRaw
}

const tabs: Tab[] = [
  { icon: 'house', label: 'Home', to: { name: 'home' } },
  { icon: 'network', label: 'Map', to: { name: 'knowledge-map' } },
  { icon: 'target', label: 'Practice', to: { name: 'practice' } },
  { icon: 'chart-line', label: 'Insights' },
]

const emit = defineEmits<{
  more: []
}>()

const tabClasses =
  'group flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-0.75 rounded-md text-[11px] font-semibold text-ink-muted aria-[current=page]:text-primary'
// The tab you're on gets a pill behind its icon (RouterLink sets aria-current="page").
const pillClasses =
  'inline-grid h-7.5 w-13 place-items-center rounded-full transition-colors duration-150 ease-default group-aria-[current=page]:bg-sprout-soft group-aria-[current=page]:text-sprout-ink'
</script>

<template>
  <nav aria-label="Main" class="flex gap-1 border-t border-line bg-surface px-2 pt-1.5 pb-4.5">
    <template v-for="tab in tabs" :key="tab.label">
      <RouterLink v-if="tab.to" :to="tab.to" :class="tabClasses" data-test="tab">
        <span :class="pillClasses"><BaseIcon :name="tab.icon" /></span>
        {{ tab.label }}
      </RouterLink>
      <a v-else href="#" :class="tabClasses" data-test="tab" @click.prevent>
        <span :class="pillClasses"><BaseIcon :name="tab.icon" /></span>
        {{ tab.label }}
      </a>
    </template>

    <button type="button" :class="tabClasses" data-test="tab-more" @click="emit('more')">
      <span :class="pillClasses"><BaseIcon name="ellipsis" /></span>
      More
    </button>
  </nav>
</template>
