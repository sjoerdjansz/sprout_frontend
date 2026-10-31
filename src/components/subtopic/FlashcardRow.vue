<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import MaterialRow from '@/components/subtopic/MaterialRow.vue'
import { flashcardStatus, lastReview, type CardStatus } from '@/lib/subtopicPage'
import type { Flashcard } from '@/stores/flashcards'

const { card } = defineProps<{
  card: Flashcard
}>()

const emit = defineEmits<{
  edit: []
  togglePause: []
  remove: []
}>()

const status = computed<CardStatus>(() => flashcardStatus(card))
const review = computed<string | null>(() => lastReview(card))
</script>

<template>
  <MaterialRow icon="layers" :tint="status.tint" :dimmed="card.paused" data-test="card">
    <b class="text-[15px] leading-5 font-[650] text-ink" data-test="card-front-text">
      {{ card.front }}
    </b>
    <span class="text-label font-normal text-ink-muted">{{ card.back }}</span>

    <template #meta>
      <BaseBadge :tone="status.tone" :icon="status.icon" data-test="card-status">
        {{ status.label }}
      </BaseBadge>
      <span v-if="review" class="text-caption font-normal text-ink-subtle">{{ review }}</span>
    </template>

    <template #actions>
      <BaseIconButton
        icon="pencil"
        label="Edit card"
        size="sm"
        data-test="edit-card"
        @click="emit('edit')"
      />
      <BaseIconButton
        :icon="card.paused ? 'play' : 'pause'"
        :label="card.paused ? 'Resume card' : 'Pause card'"
        size="sm"
        data-test="toggle-pause"
        @click="emit('togglePause')"
      />
      <BaseIconButton
        icon="trash-2"
        label="Delete card"
        size="sm"
        data-test="delete-card"
        @click="emit('remove')"
      />
    </template>
  </MaterialRow>
</template>
