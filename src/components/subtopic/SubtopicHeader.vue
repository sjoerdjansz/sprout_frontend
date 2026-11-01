<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import ProgressRing from '@/components/ProgressRing.vue'
import { facetStateClasses } from '@/components/topics/facetStateClasses'
import SubtopicMenu from '@/components/subtopic/SubtopicMenu.vue'
import { facetState, facets, subtopicLevel, type Level } from '@/lib/topics'
import type { FacetProgress, SubtopicDetail } from '@/stores/topics'

const { subtopic } = defineProps<{
  subtopic: SubtopicDetail
}>()

const emit = defineEmits<{
  practice: []
  edit: []
  delete: []
}>()

const level = computed<Level>(() => subtopicLevel(subtopic))

function facetTitle(label: string, progress: FacetProgress): string {
  if (progress.holding) {
    return `${label}: holding over time`
  }

  return progress.percent === null ? `${label}: not started` : `${label}: not yet consistent`
}

const crumbClasses =
  'inline-flex items-center gap-1.5 rounded-sm text-label text-ink-muted hover:text-ink'
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2">
    <RouterLink :to="{ name: 'topics' }" :class="crumbClasses" data-test="crumb-library">
      <BaseIcon name="chevron-left" :size="16" />
      Topics
    </RouterLink>
    <span aria-hidden="true" class="text-ink-subtle">/</span>
    <RouterLink
      :to="{ name: 'topics', query: { topic: subtopic.topic.id } }"
      :class="crumbClasses"
      data-test="crumb-topic"
    >
      {{ subtopic.topic.title }}
    </RouterLink>
    <span aria-hidden="true" class="text-ink-subtle">/</span>
    <span aria-current="page" class="text-label text-ink">{{ subtopic.title }}</span>
  </nav>

  <section
    aria-label="Subtopic"
    class="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-line bg-surface px-6 py-4.5 shadow-sm"
  >
    <ProgressRing :value="subtopic.mastery" :size="64" :label="`Mastery ${subtopic.mastery}%`" />

    <div class="flex min-w-0 flex-[1_1_300px] flex-col gap-1">
      <span class="text-overline text-ink-subtle uppercase">
        {{ subtopic.topic.title }} · Subtopic
      </span>
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="font-display text-title-lg text-ink" data-test="subtopic-title">
          {{ subtopic.title }}
        </h1>
        <BaseBadge :tone="level.tone" :icon="level.icon" data-test="level">
          {{ level.label }}
        </BaseBadge>
        <BaseBadge
          v-if="subtopic.generation_status === 'generating'"
          tone="sky"
          icon="sparkles"
          data-test="generation-badge"
        >
          Making cards
        </BaseBadge>
        <BaseBadge
          v-else-if="subtopic.generation_status === 'failed'"
          tone="ember"
          icon="circle-help"
          data-test="generation-badge"
        >
          Cards not made
        </BaseBadge>
      </div>
      <p class="text-[14px] leading-5 text-ink-muted">
        {{ subtopic.description || 'No description yet.' }}
      </p>
    </div>

    <div role="group" aria-label="Mastery by facet" class="flex flex-wrap gap-2">
      <span
        v-for="facet in facets"
        :key="facet.key"
        :title="facetTitle(facet.label, subtopic.facets[facet.key])"
        class="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-canvas pr-3 pl-1.5"
        data-test="facet"
      >
        <span
          class="inline-grid size-6 place-items-center rounded-full"
          :class="facetStateClasses[facetState(subtopic.facets[facet.key])]"
        >
          <BaseIcon :name="facet.icon" :size="14" />
        </span>
        <span class="text-caption font-semibold text-ink-muted">{{ facet.label }}</span>
        <b class="font-display text-[14px] font-semibold text-ink">
          {{
            subtopic.facets[facet.key].percent === null
              ? '–'
              : `${subtopic.facets[facet.key].percent}%`
          }}
        </b>
      </span>
    </div>

    <div class="flex items-center gap-1.5">
      <BaseButton icon-right="arrow-right" data-test="practice" @click="emit('practice')">
        Practice
      </BaseButton>
      <BaseIconButton
        icon="pencil"
        label="Edit subtopic"
        variant="secondary"
        data-test="edit-subtopic"
        @click="emit('edit')"
      />
      <SubtopicMenu @delete="emit('delete')" />
    </div>
  </section>
</template>
