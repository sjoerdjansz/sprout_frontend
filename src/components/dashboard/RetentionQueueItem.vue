<script setup lang="ts">
import IconTile, { type Tint } from '@/components/IconTile.vue'

export interface QueueTopic {
  topic: string
  cardCount: number
  recallPercent: number
  /** Recall is dropping fast: shown in sun so it stands out from what's simply due. */
  slipping: boolean
  tint: Tint
}

const { item } = defineProps<{
  item: QueueTopic
}>()
</script>

<template>
  <li class="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
    <IconTile
      :icon="item.slipping ? 'trending-down' : 'repeat'"
      :tint="item.slipping ? 'sun' : item.tint"
      size="md"
    />

    <div class="flex grow flex-col">
      <p class="text-body-strong font-[650] text-ink">{{ item.topic }}</p>
      <p class="text-caption font-normal text-ink-subtle">
        {{ item.cardCount }} cards · {{ item.slipping ? 'slipping' : 'due today' }}
      </p>
    </div>

    <div class="flex flex-col items-end">
      <p
        class="font-display text-[17px] font-semibold"
        :class="item.slipping ? 'text-sun-ink' : 'text-ink'"
      >
        {{ item.recallPercent }}%
      </p>
      <p class="text-caption font-normal text-ink-subtle">recall</p>
    </div>
  </li>
</template>
