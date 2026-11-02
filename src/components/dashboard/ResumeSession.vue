<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { IconName } from '@/components/icons'
import TextLink, { type TextLinkTone } from '@/components/TextLink.vue'

const {
  title,
  lastStudied,
  to,
  tone = 'primary',
} = defineProps<{
  title: string
  /** When you last studied it, e.g. "2 hours ago". */
  lastStudied: string
  to: RouteLocationRaw
  /** A conversation by default; a practice session shows its own. */
  icon?: IconName
  /** `on-primary` on a `primary` ground, as in the dashboard's tutor prompt. */
  tone?: TextLinkTone
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3" data-test="resume-session">
    <p
      class="grow text-sm"
      :class="tone === 'on-primary' ? 'text-on-primary/80' : 'text-ink-muted'"
    >
      Pick up where you left off:
      <strong class="font-[650]" :class="tone === 'on-primary' ? 'text-on-primary' : 'text-ink'">{{
        title
      }}</strong
      >, {{ lastStudied }}
    </p>
    <TextLink :to="to" icon-right="arrow-right" :tone="tone">Continue</TextLink>
  </div>
</template>
