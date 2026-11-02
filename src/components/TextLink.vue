<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

export type TextLinkTone = 'primary' | 'on-primary'

const {
  to,
  iconRight,
  tone = 'primary',
} = defineProps<{
  /** Where the link goes. Leave it out while the page doesn't exist yet: the link then does nothing. */
  to?: RouteLocationRaw
  iconRight?: IconName
  /** `on-primary` for a link on a `primary` ground, where the primary colour would disappear. */
  tone?: TextLinkTone
}>()

const toneClasses: Record<TextLinkTone, string> = {
  primary: 'text-primary hover:text-primary-hover',
  'on-primary': 'text-on-primary hover:text-on-primary/80',
}

const linkClasses = computed<string[]>(() => [
  'inline-flex items-center gap-1 text-sm font-[650]',
  toneClasses[tone],
])
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
