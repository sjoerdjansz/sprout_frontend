<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

const {
  icon,
  label,
  to,
  collapsed = false,
} = defineProps<{
  icon: IconName
  label: string
  /** Leave it out while the page doesn't exist yet: the link then does nothing. */
  to?: RouteLocationRaw
  /** Icon only; the label stays for screen readers and shows as a tooltip. */
  collapsed?: boolean
}>()

const linkClasses = computed<string>(
  () =>
    `flex h-11 items-center gap-3 rounded-md text-body-strong text-ink-muted transition-colors duration-150 ease-default hover:bg-surface hover:text-ink ${collapsed ? 'justify-center px-0' : 'px-3'}`,
)
</script>

<template>
  <!-- RouterLink sets aria-current="page" on the page you're on. -->
  <RouterLink
    v-if="to"
    :to="to"
    :title="collapsed ? label : undefined"
    :class="linkClasses"
    exact-active-class="bg-surface text-ink shadow-sm"
  >
    <BaseIcon :name="icon" />
    <span :class="{ 'sr-only': collapsed }">{{ label }}</span>
  </RouterLink>

  <a v-else href="#" :title="collapsed ? label : undefined" :class="linkClasses" @click.prevent>
    <BaseIcon :name="icon" />
    <span :class="{ 'sr-only': collapsed }">{{ label }}</span>
  </a>
</template>
