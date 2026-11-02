<script setup lang="ts">
import { computed } from 'vue'
import BaseTabs, { type TabItem } from '@/components/BaseTabs.vue'
import { amountOptions, selectedAmount, type PracticeAmount } from '@/lib/practiceSession'
import { pluralize } from '@/lib/topics'

const { label, unit, sizes, available } = defineProps<{
  /** "How many cards?" */
  label: string
  /** "card" or "question", for "All 7 cards". */
  unit: string
  sizes: number[]
  /** What the scope has; null before it has loaded once. */
  available: number | null
}>()

const amount = defineModel<PracticeAmount>({ required: true })

// Before the first load there's nothing to fit the sizes to, so they show as they are.
const items = computed<TabItem[]>(() =>
  available === null
    ? sizes.map((size) => ({ id: String(size), label: String(size) }))
    : amountOptions(sizes, available),
)

const selectedTab = computed<string>({
  get: () => (available === null ? String(amount.value) : selectedAmount(amount.value, available)),
  set: (id) => (amount.value = id === 'all' ? 'all' : Number(id)),
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-label text-ink">{{ label }}</span>
    <!-- With one option there's nothing to pick: say what the session gets. -->
    <p
      v-if="available !== null && items.length === 1"
      class="flex h-11.5 items-center text-body text-ink"
      data-test="amount-all"
    >
      All {{ pluralize(available, unit) }}
    </p>
    <BaseTabs v-else v-model="selectedTab" :items="items" :label="label" />
  </div>
</template>
