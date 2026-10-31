<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIcon from '@/components/BaseIcon.vue'

const { front, back, topic, position } = defineProps<{
  front: string
  back: string
  /** The subtopic, shown as a badge on both sides. */
  topic?: string
  /** "8 / 20". */
  position?: string
}>()

/** The answer side is showing. Flipping is retrieval first, so the parent decides when. */
const flipped = defineModel<boolean>('flipped', { required: true })
</script>

<template>
  <!-- A 3D flip of 500ms; with reduced motion the faces swap with a fade instead. -->
  <button
    type="button"
    class="group relative h-75 w-full max-w-130 cursor-pointer rounded-xl text-center perspective-[1400px] focus-visible:shadow-focus-ring focus-visible:outline-none"
    :aria-label="
      flipped ? 'Answer shown. Activate to see the question' : 'Activate to reveal the answer'
    "
    :data-flipped="flipped"
    data-test="flashcard"
    @click="flipped = !flipped"
  >
    <div
      class="absolute inset-0 transition-transform duration-500 ease-default transform-3d motion-reduce:transition-none"
      :class="{ 'rotate-y-180 motion-reduce:rotate-y-0': flipped }"
    >
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl border border-line bg-surface px-8 py-10 shadow-md backface-hidden motion-reduce:transition-opacity motion-reduce:duration-250"
        :class="{ 'motion-reduce:opacity-0': flipped }"
        :aria-hidden="flipped ? 'true' : undefined"
      >
        <div class="absolute inset-x-6 top-5 flex items-center justify-between">
          <BaseBadge v-if="topic" tone="sprout" icon="layers">{{ topic }}</BaseBadge>
          <span v-else />
          <span v-if="position" class="text-caption font-semibold text-ink-subtle tabular-nums">
            {{ position }}
          </span>
        </div>
        <p class="font-display text-card-face text-balance text-ink" data-test="flashcard-front">
          {{ front }}
        </p>
        <p
          class="absolute inset-x-0 bottom-5 flex items-center justify-center gap-1.5 text-caption font-normal text-ink-subtle"
        >
          <BaseIcon name="rotate-ccw" :size="14" />
          Tap or press space to flip
        </p>
      </div>

      <div
        class="absolute inset-0 flex rotate-y-180 flex-col items-center justify-center gap-4 rounded-xl bg-surface-tint px-8 py-10 shadow-md backface-hidden motion-reduce:rotate-y-0 motion-reduce:opacity-0 motion-reduce:transition-opacity motion-reduce:duration-250"
        :class="{ 'motion-reduce:opacity-100': flipped }"
        :aria-hidden="flipped ? undefined : 'true'"
      >
        <div class="absolute inset-x-6 top-5 flex items-center justify-between">
          <BaseBadge v-if="topic" tone="sprout" icon="layers">{{ topic }}</BaseBadge>
          <span v-else />
          <span v-if="position" class="text-caption font-semibold text-ink-subtle tabular-nums">
            {{ position }}
          </span>
        </div>
        <p class="text-body-lg text-balance text-ink" data-test="flashcard-back">{{ back }}</p>
        <p class="absolute inset-x-0 bottom-5 text-caption font-normal text-ink-subtle">
          Did you know it?
        </p>
      </div>
    </div>
  </button>
</template>
