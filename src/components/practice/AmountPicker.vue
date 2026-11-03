<script setup lang="ts">
import { computed } from 'vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import AmountChoice from '@/components/practice/AmountChoice.vue'
import { practiceMode, type PracticeModeId } from '@/lib/practiceModes'
import type { AvailableCounts, PracticeAmount } from '@/lib/practiceSession'

const { modes, available, wholeTopic } = defineProps<{
  /** The modes that will run; the page only shows this step with flashcards or the quiz. */
  modes: PracticeModeId[]
  /** The scope's cards and questions; null while they load. */
  available: AvailableCounts | null
  wholeTopic: boolean
}>()

const cardAmount = defineModel<PracticeAmount>('cardAmount', { required: true })
const questionAmount = defineModel<PracticeAmount>('questionAmount', { required: true })
const dueFirst = defineModel<boolean>('dueFirst', { required: true })
const interleave = defineModel<boolean>('interleave', { required: true })

const hasCards = computed<boolean>(() => modes.includes('cards'))
const hasQuestions = computed<boolean>(() => modes.includes('retrieval'))
</script>

<template>
  <div class="flex flex-wrap items-end gap-x-7 gap-y-4 motion-safe:stagger-pop">
    <AmountChoice
      v-if="hasCards"
      v-model="cardAmount"
      label="How many cards?"
      unit="card"
      :sizes="practiceMode('cards').sizes"
      :available="available?.cards ?? null"
      data-test="card-amount"
    />
    <AmountChoice
      v-if="hasQuestions"
      v-model="questionAmount"
      label="How many questions?"
      unit="question"
      :sizes="practiceMode('retrieval').sizes"
      :available="available?.questions ?? null"
      data-test="question-amount"
    />
    <BaseSwitch
      v-if="wholeTopic"
      v-model="interleave"
      label="Mix subtopics together (interleaving)"
      data-test="interleave"
    />
    <BaseSwitch v-model="dueFirst" label="What’s due first" data-test="due-first" />
  </div>
</template>
