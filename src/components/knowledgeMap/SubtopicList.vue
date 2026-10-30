<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import SubtopicRow from '@/components/knowledgeMap/SubtopicRow.vue'
import { facets, pluralize } from '@/lib/knowledgeMap'
import type { Subtopic, Topic } from '@/stores/topics'

const { topic, subtopics, selectedSubtopicId } = defineProps<{
  topic: Topic
  /** The topic's subtopics that match the filters. */
  subtopics: Subtopic[]
  selectedSubtopicId: number | null
}>()

const emit = defineEmits<{
  select: [subtopicId: number]
  addSubtopic: []
}>()
</script>

<template>
  <section aria-label="Subtopics" class="flex flex-col gap-2.5 rail:min-h-0 rail:flex-[2_1_0]">
    <div class="flex flex-none flex-wrap items-baseline justify-between gap-3">
      <h2 class="font-display text-title text-ink" data-test="subtopics-heading">
        {{ topic.title }}
        <span class="font-sans text-[14px] font-medium tracking-normal text-ink-subtle">
          · {{ pluralize(topic.subtopics.length, 'subtopic') }}
        </span>
      </h2>
      <div class="flex items-center gap-4">
        <span class="flex flex-wrap gap-x-3.5 gap-y-1.5 text-caption font-normal text-ink-subtle">
          <span v-for="facet in facets" :key="facet.key" class="inline-flex items-center gap-1">
            <BaseIcon :name="facet.icon" :size="14" />
            {{ facet.label }}
          </span>
          <span>· solid = holding over time</span>
        </span>
        <BaseButton
          variant="ghost"
          size="sm"
          icon="plus"
          data-test="add-subtopic"
          @click="emit('addSubtopic')"
        >
          Add subtopic
        </BaseButton>
      </div>
    </div>

    <ul
      class="flex flex-auto flex-col gap-0.5 rounded-lg border border-line bg-surface p-1.5 shadow-sm rail:min-h-0 rail:overflow-y-auto"
    >
      <SubtopicRow
        v-for="subtopic in subtopics"
        :key="subtopic.id"
        :subtopic="subtopic"
        :selected="subtopic.id === selectedSubtopicId"
        @select="emit('select', subtopic.id)"
      />
      <li
        v-if="subtopics.length === 0"
        class="px-3.5 py-4 text-[14px] text-ink-muted"
        data-test="no-subtopics"
      >
        {{
          topic.subtopics.length === 0
            ? 'No subtopics yet. Add the first one.'
            : 'No subtopics match the current filter.'
        }}
      </li>
    </ul>
  </section>
</template>
