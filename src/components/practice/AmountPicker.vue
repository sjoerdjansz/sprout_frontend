<script setup lang="ts">
import { computed } from 'vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import BaseTabs, { type TabItem } from '@/components/BaseTabs.vue'
import { practiceMode, type PracticeModeId } from '@/lib/practiceModes'

const { modes, wholeTopic } = defineProps<{
  /** The modes that will run. */
  modes: PracticeModeId[]
  wholeTopic: boolean
}>()

const cardCount = defineModel<number>('cardCount', { required: true })
const questionCount = defineModel<number>('questionCount', { required: true })
const dueFirst = defineModel<boolean>('dueFirst', { required: true })
const interleave = defineModel<boolean>('interleave', { required: true })

function sizeItems(mode: PracticeModeId): TabItem[] {
  return practiceMode(mode).sizes.map((size) => ({ id: String(size), label: String(size) }))
}

// BaseTabs works with string ids; the counts are numbers.
const cardSize = computed<string>({
  get: () => String(cardCount.value),
  set: (size) => (cardCount.value = Number(size)),
})
const questionSize = computed<string>({
  get: () => String(questionCount.value),
  set: (size) => (questionCount.value = Number(size)),
})

const hasCards = computed<boolean>(() => modes.includes('cards'))
const hasQuestions = computed<boolean>(() => modes.includes('retrieval'))
</script>

<template>
  <div class="flex flex-wrap items-end gap-x-7 gap-y-4">
    <div v-if="hasCards" class="flex flex-col gap-1.5">
      <span class="text-label text-ink">How many cards?</span>
      <BaseTabs v-model="cardSize" :items="sizeItems('cards')" label="How many cards?" />
    </div>
    <div v-if="hasQuestions" class="flex flex-col gap-1.5">
      <span class="text-label text-ink">How many questions?</span>
      <BaseTabs
        v-model="questionSize"
        :items="sizeItems('retrieval')"
        label="How many questions?"
      />
    </div>
    <BaseSwitch
      v-if="wholeTopic && (hasCards || hasQuestions)"
      v-model="interleave"
      label="Mix subtopics together (interleaving)"
      data-test="interleave"
    />
    <BaseSwitch
      v-if="hasCards || hasQuestions"
      v-model="dueFirst"
      label="What’s due first"
      data-test="due-first"
    />
  </div>

  <ul class="flex flex-col gap-1 text-label font-normal text-ink-muted">
    <li v-if="modes.includes('feynman')">
      Explain it: one concept. You explain it, compare it with your cards and simplify. About 12
      minutes.
    </li>
    <li v-if="modes.includes('open')">
      Open session: no fixed length. The tutor asks before it tells; wrap up when you’re ready.
    </li>
  </ul>
</template>
