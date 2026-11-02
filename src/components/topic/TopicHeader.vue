<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import ProgressRing from '@/components/ProgressRing.vue'
import ItemMenu from '@/components/topics/ItemMenu.vue'
import { averageMastery, dueCards, pluralize } from '@/lib/topics'
import type { Topic } from '@/stores/topics'

const { topic } = defineProps<{
  topic: Topic
}>()

const emit = defineEmits<{
  practice: []
  addSubtopic: []
  edit: []
  delete: []
}>()

const mastery = computed<number>(() => averageMastery(topic))
const due = computed<number>(() => dueCards(topic))
// Starts with its separator, so it sits right after the subtopic count.
const dueLabel = computed<string>(() => ` · ${pluralize(due.value, 'card')} due today`)
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2">
    <RouterLink
      :to="{ name: 'topics' }"
      class="inline-flex items-center gap-1.5 rounded-sm text-label text-ink-muted hover:text-ink"
      data-test="crumb-library"
    >
      <BaseIcon name="chevron-left" :size="16" />
      Topics
    </RouterLink>
    <span aria-hidden="true" class="text-ink-subtle">/</span>
    <span aria-current="page" class="text-label text-ink">{{ topic.title }}</span>
  </nav>

  <section
    aria-labelledby="topic-title"
    class="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-line bg-surface px-6 py-5 shadow-sm"
  >
    <ProgressRing :value="mastery" :size="64" :label="`${topic.title} mastery ${mastery}%`" />

    <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
      <span class="text-overline text-ink-subtle uppercase">{{ topic.category.name }} · Topic</span>
      <h1 id="topic-title" class="font-display text-title-lg text-ink" data-test="topic-title">
        {{ topic.title }}
      </h1>
      <p class="text-label font-normal text-ink-muted" data-test="topic-meta">
        {{ pluralize(topic.subtopics.length, 'subtopic')
        }}<span v-if="due > 0" class="font-[650] text-sun-ink">{{ dueLabel }}</span>
      </p>
      <p
        v-if="topic.description"
        class="mt-1 text-[14px] leading-5 text-ink-muted"
        data-test="topic-description"
      >
        {{ topic.description }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <BaseButton icon-right="arrow-right" data-test="practice" @click="emit('practice')">
        Practice
      </BaseButton>
      <BaseButton
        variant="secondary"
        icon="plus"
        data-test="add-subtopic"
        @click="emit('addSubtopic')"
      >
        Add subtopic
      </BaseButton>
      <ItemMenu kind="topic" :title="topic.title" @edit="emit('edit')" @delete="emit('delete')" />
    </div>
  </section>
</template>
