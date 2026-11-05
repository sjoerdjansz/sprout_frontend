<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'
import IconTile from '@/components/IconTile.vue'
import TextLink from '@/components/TextLink.vue'

const { hasTopics } = defineProps<{
  /** Without topics there's nothing to practise yet, so it points at adding one. */
  hasTopics: boolean
}>()
</script>

<template>
  <BaseCard tint class="flex flex-wrap items-center gap-4" data-test="insights-welcome">
    <IconTile icon="sprout" tint="mint" />
    <div class="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
      <h2 class="text-heading text-ink">Your insights grow as you practise</h2>
      <p class="text-label font-normal text-ink-muted">
        Rate a few cards or answer a quiz question, and your streak, recall rate and plant start
        growing here.
      </p>
    </div>
    <TextLink
      :to="hasTopics ? { name: 'practice' } : { name: 'topics' }"
      icon-right="arrow-right"
      data-test="insights-welcome-link"
    >
      {{ hasTopics ? 'Start practising' : 'Add a topic' }}
    </TextLink>
  </BaseCard>
</template>
