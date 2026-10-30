<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import PracticeModeOption from '@/components/knowledgeMap/PracticeModeOption.vue'
import {
  practiceMode,
  practiceModes,
  type PracticeMode,
  type PracticeModeId,
  type PracticeSuggestion,
} from '@/lib/knowledgeMap'

const { suggestion, subjectTitle } = defineProps<{
  suggestion: PracticeSuggestion
  /** The topic or subtopic you'd practise. */
  subjectTitle: string
}>()

// Local on purpose: the view remounts the picker (with a `key`) when you select something else.
const isOpen = ref(false)
const chosenModeId = ref<PracticeModeId>(suggestion.mode.id)
const chosenMode = computed<PracticeMode>(() => practiceMode(chosenModeId.value))

function open(): void {
  chosenModeId.value = suggestion.mode.id
  isOpen.value = true
}
</script>

<template>
  <div v-if="!isOpen" class="flex flex-col gap-2.5">
    <BaseButton size="lg" block icon-right="arrow-right" data-test="practice" @click="open">
      Practice this topic
    </BaseButton>
    <p class="text-center text-label font-normal text-ink-muted" data-test="suggestion">
      Suggested: <strong class="font-semibold text-ink">{{ suggestion.mode.name }}</strong> —
      {{ suggestion.reason }}
    </p>
  </div>

  <div v-else class="flex flex-col gap-2.5">
    <div class="flex items-center justify-between">
      <h3 class="text-[15px] leading-5 font-bold text-ink">How do you want to practise?</h3>
      <BaseIconButton
        icon="x"
        label="Back"
        size="sm"
        data-test="close-practice"
        @click="isOpen = false"
      />
    </div>
    <PracticeModeOption
      v-for="mode in practiceModes"
      :key="mode.id"
      :mode="mode"
      :selected="mode.id === chosenModeId"
      :suggested="mode.id === suggestion.mode.id"
      :data-test="`mode-${mode.id}`"
      @pick="chosenModeId = mode.id"
    />
    <!-- No practice sessions yet (see ../specs/knowledge-map.md): this button does nothing for now. -->
    <BaseButton size="lg" block icon-right="arrow-right" data-test="start-practice">
      {{ chosenMode.startLabel }}
    </BaseButton>
    <p class="text-center text-caption font-normal text-ink-subtle">
      About {{ chosenMode.minutes }} min · {{ subjectTitle }}
    </p>
  </div>
</template>
