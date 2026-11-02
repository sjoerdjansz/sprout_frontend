<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import ProgressRing from '@/components/ProgressRing.vue'
import ItemMenu from '@/components/topics/ItemMenu.vue'
import { averageMastery } from '@/lib/topics'
import type { Topic } from '@/stores/topics'

const { topic } = defineProps<{
  topic: Topic
}>()

const emit = defineEmits<{
  practice: []
  edit: []
  delete: []
}>()

const mastery = computed<number>(() => averageMastery(topic))
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

  <!-- The menu sits in the top right corner, where the topic cards have theirs, so it never wraps
       onto a line of its own; Practice follows the text it acts on. -->
  <section
    aria-labelledby="topic-title"
    class="relative flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-line bg-surface px-6 py-5 shadow-sm"
  >
    <ProgressRing :value="mastery" :size="64" :label="`${topic.title} mastery ${mastery}%`" />

    <!-- Room on the right for the menu. -->
    <div class="flex min-w-0 flex-[1_1_320px] flex-col items-start gap-1 pr-10">
      <span class="text-overline text-ink-subtle uppercase">Topic: {{ topic.category.name }}</span>
      <h1 id="topic-title" class="font-display text-title-lg text-ink" data-test="topic-title">
        {{ topic.title }}
      </h1>
      <p
        v-if="topic.description"
        class="mt-1 text-[14px] leading-5 text-ink-muted"
        data-test="topic-description"
      >
        {{ topic.description }}
      </p>
      <BaseButton
        icon-right="arrow-right"
        class="mt-3"
        data-test="practice"
        @click="emit('practice')"
      >
        Practice
      </BaseButton>
    </div>

    <div class="absolute top-4 right-4">
      <ItemMenu kind="topic" :title="topic.title" @edit="emit('edit')" @delete="emit('delete')" />
    </div>
  </section>
</template>
