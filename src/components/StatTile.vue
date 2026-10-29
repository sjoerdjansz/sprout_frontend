<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'
import IconTile, { type Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'

const { label, value, unit, hint, icon, tint } = defineProps<{
  /** Two words at most. */
  label: string
  value: string
  unit?: string
  /** Compares to something real ("+3 points vs last week"). */
  hint?: string
  icon?: IconName
  tint?: Tint
}>()
</script>

<template>
  <BaseCard padding="sm" class="flex min-w-40 flex-col gap-3">
    <div class="flex items-center justify-between gap-2 text-label text-ink-muted">
      <span>{{ label }}</span>
      <IconTile v-if="icon" :icon="icon" :tint="tint" size="sm" />
    </div>

    <p class="font-display text-stat text-ink tabular-nums">
      {{ value }}
      <small
        v-if="unit"
        class="ml-1 font-sans text-body font-medium tracking-normal text-ink-muted"
      >
        {{ unit }}
      </small>
    </p>

    <p v-if="hint" class="text-caption font-normal text-ink-subtle">{{ hint }}</p>
  </BaseCard>
</template>
