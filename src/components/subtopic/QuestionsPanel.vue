<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import MaterialToolbar from '@/components/subtopic/MaterialToolbar.vue'
import QuestionRow from '@/components/subtopic/QuestionRow.vue'
import { filterQuestions, questionFilters, type QuestionFilter } from '@/lib/subtopicPage'
import type { Question } from '@/stores/questions'

const { questions } = defineProps<{
  questions: Question[]
}>()

const emit = defineEmits<{
  remove: [question: Question]
}>()

const query = ref('')
const filter = ref<QuestionFilter>('all')
// One question open at a time, as in the design.
const expandedId = ref<number | null>(null)

const shownQuestions = computed<Question[]>(() =>
  filterQuestions(questions, query.value, filter.value),
)

function toggle(questionId: number): void {
  expandedId.value = expandedId.value === questionId ? null : questionId
}
</script>

<template>
  <MaterialToolbar
    v-model:query="query"
    v-model:filter="filter"
    search-label="Search questions"
    :filters="questionFilters"
  >
    <!-- No practice sessions yet (see ../specs/subtopic-page.md). -->
    <BaseButton size="sm" icon="list-checks" disabled title="Coming soon">Quiz me now</BaseButton>
  </MaterialToolbar>

  <ul class="flex flex-col gap-0.5 p-2">
    <QuestionRow
      v-for="question in shownQuestions"
      :key="question.id"
      :question="question"
      :expanded="expandedId === question.id"
      @toggle="toggle(question.id)"
      @remove="emit('remove', question)"
    />
    <li
      v-if="shownQuestions.length === 0"
      class="px-4 py-8 text-center text-[14px] text-ink-muted"
      data-test="empty"
    >
      {{
        questions.length === 0
          ? 'No questions yet. Generate them from your notes.'
          : 'No questions match this filter.'
      }}
    </li>
  </ul>
</template>
