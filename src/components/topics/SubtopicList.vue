<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import SubtopicRow from '@/components/topics/SubtopicRow.vue'
import type { Subtopic } from '@/stores/topics'

const { subtopics, topicTitle, topicIsEmpty } = defineProps<{
  /** The subtopics that match the search and filter. */
  subtopics: Subtopic[]
  topicTitle: string
  /** The topic has no subtopics at all, so there's nothing a filter could find. */
  topicIsEmpty: boolean
}>()

const emit = defineEmits<{
  addSubtopic: []
  clearFilters: []
  editSubtopic: [subtopicId: number]
  deleteSubtopic: [subtopicId: number]
}>()

const emptyClasses =
  'flex flex-col items-center gap-2.5 rounded-lg bg-surface-tint px-6 py-7 text-center'
</script>

<template>
  <div v-if="topicIsEmpty" :class="emptyClasses" data-test="no-subtopics">
    <p class="text-heading text-ink">No subtopics yet</p>
    <p class="text-[14px] leading-5 text-ink-muted">
      Add the first one, or ask the tutor about {{ topicTitle }} and save the chat.
    </p>
    <BaseButton size="sm" icon="plus" @click="emit('addSubtopic')">Add subtopic</BaseButton>
  </div>

  <div v-else-if="subtopics.length === 0" :class="emptyClasses" data-test="no-matches">
    <p class="text-heading text-ink">No subtopics match</p>
    <p class="text-[14px] leading-5 text-ink-muted">Try another word or filter.</p>
    <BaseButton
      variant="secondary"
      size="sm"
      data-test="clear-filters"
      @click="emit('clearFilters')"
    >
      Clear filters
    </BaseButton>
  </div>

  <ul v-else class="flex flex-col gap-0.5 rounded-lg border border-line bg-surface p-1.5 shadow-sm">
    <SubtopicRow
      v-for="subtopic in subtopics"
      :key="subtopic.id"
      :subtopic="subtopic"
      @edit="emit('editSubtopic', subtopic.id)"
      @delete="emit('deleteSubtopic', subtopic.id)"
    />
  </ul>
</template>
