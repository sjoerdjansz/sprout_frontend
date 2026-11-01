<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import IconTile from '@/components/IconTile.vue'
import type { QueueTopic } from '@/lib/dashboard'
import { pluralize } from '@/lib/topics'

const { item } = defineProps<{
  item: QueueTopic
}>()

// A slipping topic can have nothing due yet: then "slipping" says it all.
const caption = computed<string>(() => {
  if (item.slipping) {
    return item.cardCount > 0 ? `${pluralize(item.cardCount, 'card')} · slipping` : 'Slipping'
  }

  return `${pluralize(item.cardCount, 'card')} · due today`
})
</script>

<template>
  <li class="border-b border-line last:border-b-0">
    <!-- Reviewing one topic: the practice setup with its flashcards picked. -->
    <RouterLink
      :to="{ name: 'practice', query: { topic: item.topicId, modes: 'cards' } }"
      class="-mx-2 flex min-h-14 items-center gap-3 rounded-md px-2 py-2.5 transition-colors duration-150 ease-default hover:bg-surface-sunken"
      data-test="queue-item"
    >
      <IconTile
        :icon="item.slipping ? 'trending-down' : 'repeat'"
        :tint="item.slipping ? 'sun' : item.tint"
        size="md"
      />

      <span class="flex grow flex-col">
        <span class="text-body-strong font-[650] text-ink">{{ item.title }}</span>
        <span class="text-caption font-normal text-ink-subtle">{{ caption }}</span>
      </span>

      <span class="flex flex-col items-end">
        <span
          class="font-display text-[17px] font-semibold"
          :class="item.slipping ? 'text-sun-ink' : 'text-ink'"
        >
          {{ item.mastery }}%
        </span>
        <span class="text-caption font-normal text-ink-subtle">mastery</span>
      </span>
    </RouterLink>
  </li>
</template>
