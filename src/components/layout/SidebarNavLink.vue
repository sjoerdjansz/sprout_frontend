<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

const { icon, to } = defineProps<{
  icon: IconName
  /** Leave it out while the page doesn't exist yet: the link then does nothing. */
  to?: RouteLocationRaw
}>()

const linkClasses =
  'flex h-11 items-center gap-3 rounded-md px-3 text-body-strong text-ink-muted transition-colors duration-150 ease-default hover:bg-surface hover:text-ink'
</script>

<template>
  <!-- RouterLink sets aria-current="page" on the page you're on. -->
  <RouterLink
    v-if="to"
    :to="to"
    :class="linkClasses"
    exact-active-class="bg-surface text-ink shadow-sm"
  >
    <BaseIcon :name="icon" />
    <slot />
  </RouterLink>

  <a v-else href="#" :class="linkClasses" @click.prevent>
    <BaseIcon :name="icon" />
    <slot />
  </a>
</template>
