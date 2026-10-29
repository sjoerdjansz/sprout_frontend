<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

const { to, iconRight } = defineProps<{
  /** Where the link goes. Leave it out while the page doesn't exist yet: the link then does nothing. */
  to?: RouteLocationRaw
  iconRight?: IconName
}>()

const linkClasses =
  'inline-flex items-center gap-1 text-sm font-[650] text-primary hover:text-primary-hover'
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="linkClasses">
    <slot />
    <BaseIcon v-if="iconRight" :name="iconRight" :size="16" />
  </RouterLink>

  <a v-else href="#" :class="linkClasses" @click.prevent>
    <slot />
    <BaseIcon v-if="iconRight" :name="iconRight" :size="16" />
  </a>
</template>
