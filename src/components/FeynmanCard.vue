<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import { explanationParts, type ExplanationPart } from '@/lib/practiceSession'
import type { Gap } from '@/stores/questions'

const {
  explanation,
  gaps,
  title = 'Your explanation',
} = defineProps<{
  explanation: string
  /** Quoted exactly from the explanation; each is highlighted with its question. */
  gaps: Gap[]
  title?: string
}>()

const parts = computed<ExplanationPart[]>(() => explanationParts(explanation, gaps))
const markedGaps = computed<Gap[]>(() =>
  parts.value.flatMap((part) => (part.gap === null ? [] : [part.gap])),
)
</script>

<!-- The Feynman technique: your words, with the gaps Sprout asks about. Curious, not wrong: sun, never ember. -->
<template>
  <section
    class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-sm"
    data-test="feynman-card"
  >
    <div class="flex items-center gap-2.5">
      <span class="grid size-8 place-items-center rounded-sm bg-sun-soft text-sun-ink">
        <BaseIcon name="lightbulb" :size="18" />
      </span>
      <b class="text-body-strong text-ink">{{ title }}</b>
    </div>

    <p class="text-body-lg whitespace-pre-wrap text-ink">
      <template v-for="(part, index) in parts" :key="index">
        <mark
          v-if="part.gap"
          class="rounded-xs bg-sun-soft px-0.5 text-ink underline decoration-sun-ink decoration-dashed underline-offset-4"
          data-test="gap"
          >{{ part.text
          }}<sup class="ml-0.5 text-caption font-bold text-sun-ink">{{
            markedGaps.indexOf(part.gap) + 1
          }}</sup></mark
        >
        <template v-else>{{ part.text }}</template>
      </template>
    </p>

    <ol v-if="markedGaps.length > 0" class="flex flex-col gap-2" data-test="gap-notes">
      <li
        v-for="(gap, index) in markedGaps"
        :key="gap.text"
        class="flex items-start gap-2.5 rounded-md bg-surface-tint px-3.5 py-2.5 text-body"
      >
        <span
          class="grid size-5.5 flex-none place-items-center rounded-full bg-sun text-caption font-bold text-on-sun"
        >
          {{ index + 1 }}
        </span>
        <span>{{ gap.note }}</span>
      </li>
    </ol>
  </section>
</template>
