<script setup lang="ts">
import IconTile from '@/components/IconTile.vue'
import TextLink from '@/components/TextLink.vue'

const { topic, lastStudied } = defineProps<{
  topic: string
  /** When you last studied it, e.g. "2 hours ago". */
  lastStudied: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <IconTile icon="message-circle" tint="mint" size="sm" />
    <p class="grow text-sm text-ink-muted">
      Pick up where you left off:
      <strong class="font-[650] text-ink">{{ topic }}</strong
      >, {{ lastStudied }}
    </p>
    <TextLink icon-right="arrow-right">Continue</TextLink>
  </div>
</template>
