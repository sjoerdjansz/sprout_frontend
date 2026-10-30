<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import LibraryToolbar from '@/components/knowledgeMap/LibraryToolbar.vue'
import TopicCard from '@/components/knowledgeMap/TopicCard.vue'
import type { Category, Topic } from '@/stores/topics'

const { topics, libraryIsEmpty, filterCategories, selectedTopicId, attentionCount } = defineProps<{
  /** The topics that match the filters. */
  topics: Topic[]
  /** You have no topics at all, so there's nothing a filter could find. */
  libraryIsEmpty: boolean
  /** The categories offered as filter chips. */
  filterCategories: Category[]
  selectedTopicId: number | null
  attentionCount: number
}>()

const query = defineModel<string>('query', { required: true })
const categoryId = defineModel<number | 'all'>('categoryId', { required: true })
const needsAttention = defineModel<boolean>('needsAttention', { required: true })

const emit = defineEmits<{
  select: [topicId: number]
  addTopic: []
  clearFilters: []
}>()
</script>

<template>
  <section
    aria-label="Topics"
    class="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm rail:min-h-0 rail:flex-[3_1_0]"
  >
    <LibraryToolbar
      v-model:query="query"
      v-model:category-id="categoryId"
      v-model:needs-attention="needsAttention"
      :categories="filterCategories"
      :attention-count="attentionCount"
      @add-topic="emit('addTopic')"
    />

    <div class="flex-auto bg-canvas p-4 rail:min-h-0 rail:overflow-y-auto">
      <div
        v-if="libraryIsEmpty"
        class="flex flex-col items-center gap-2.5 rounded-lg bg-surface-tint px-6 py-7 text-center"
        data-test="empty-library"
      >
        <p class="text-heading text-ink">Your library is empty</p>
        <p class="text-[14px] leading-5 text-ink-muted">
          Add a topic, or save one from a conversation with the tutor.
        </p>
        <BaseButton size="sm" icon="plus" @click="emit('addTopic')">Add topic</BaseButton>
      </div>

      <div
        v-else-if="topics.length === 0"
        class="flex flex-col items-center gap-2.5 rounded-lg bg-surface-tint px-6 py-7 text-center"
        data-test="no-results"
      >
        <p class="text-heading text-ink">Nothing matches</p>
        <p class="text-[14px] leading-5 text-ink-muted">
          Try another word, or add it as a new topic and let Sprout teach you.
        </p>
        <BaseButton
          variant="secondary"
          size="sm"
          data-test="clear-filters"
          @click="emit('clearFilters')"
        >
          Clear filters
        </BaseButton>
      </div>

      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(min(224px,100%),1fr))] gap-3">
        <TopicCard
          v-for="topic in topics"
          :key="topic.id"
          :topic="topic"
          :selected="topic.id === selectedTopicId"
          data-test="topic-card"
          @select="emit('select', topic.id)"
        />
      </div>
    </div>
  </section>
</template>
