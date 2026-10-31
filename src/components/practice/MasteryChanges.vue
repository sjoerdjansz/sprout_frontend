<script setup lang="ts">
import ProgressBar from '@/components/ProgressBar.vue'
import { dueLabel } from '@/lib/dueDate'
import type { PracticedSubtopic } from '@/stores/practice'

const { subtopics } = defineProps<{
  /** The subtopics practised in the session, with their mastery before and after it. */
  subtopics: PracticedSubtopic[]
}>()
</script>

<template>
  <section
    aria-labelledby="done-mastery"
    class="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-xl bg-surface-tint p-5"
    data-test="mastery-changes"
  >
    <h2 id="done-mastery" class="text-body-strong">Mastery</h2>
    <ul class="flex flex-col gap-3.5">
      <li v-for="subtopic in subtopics" :key="subtopic.id" class="flex flex-col gap-1">
        <ProgressBar
          :value="subtopic.mastery_after"
          :label="subtopic.title"
          :value-text="`${subtopic.mastery_before}% → ${subtopic.mastery_after}%`"
          size="sm"
        />
        <span v-if="subtopic.next_review_on" class="text-caption font-normal text-ink-subtle">
          Next review {{ dueLabel(subtopic.next_review_on) }}
        </span>
      </li>
    </ul>
  </section>
</template>
