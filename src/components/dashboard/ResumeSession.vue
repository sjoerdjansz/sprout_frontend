<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import IconTile from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'
import TextLink from '@/components/TextLink.vue'

const {
  title,
  lastStudied,
  to,
  icon = 'message-circle',
} = defineProps<{
  title: string
  /** When you last studied it, e.g. "2 hours ago". */
  lastStudied: string
  to: RouteLocationRaw
  /** A conversation by default; a practice session shows its own. */
  icon?: IconName
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3" data-test="resume-session">
    <IconTile :icon="icon" tint="mint" size="sm" />
    <p class="grow text-sm text-ink-muted">
      Pick up where you left off:
      <strong class="font-[650] text-ink">{{ title }}</strong
      >, {{ lastStudied }}
    </p>
    <TextLink :to="to" icon-right="arrow-right">Continue</TextLink>
  </div>
</template>
