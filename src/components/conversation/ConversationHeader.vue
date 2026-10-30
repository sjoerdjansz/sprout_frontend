<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'

const {
  title,
  topicTitle = null,
  canSave,
} = defineProps<{
  title: string
  /** The knowledge map topic this conversation belongs to, once saved or when continuing one. */
  topicTitle?: string | null
  /** A saved conversation is read-only and can't be saved again. */
  canSave: boolean
}>()

const emit = defineEmits<{
  save: []
}>()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex min-w-0 flex-col items-start gap-2">
      <BaseBadge v-if="topicTitle" tone="sprout" icon="network">{{ topicTitle }}</BaseBadge>
      <h1 class="font-display text-title-lg text-ink">{{ title }}</h1>
    </div>

    <BaseButton
      v-if="canSave"
      variant="secondary"
      icon="network"
      data-test="open-save"
      @click="emit('save')"
    >
      Save to knowledge map
    </BaseButton>
  </header>
</template>
