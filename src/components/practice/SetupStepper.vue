<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'

export interface WizardStep {
  id: string
  /** Short name in the stepper: "How", "What", "How much". */
  label: string
  /** The question the step asks, as its heading. */
  title: string
  /** What you picked in this step ("Flashcards", "Photosynthesis"); empty when there's nothing to say. */
  summary: string
}

const { steps, currentIndex } = defineProps<{
  steps: WizardStep[]
  currentIndex: number
}>()

const emit = defineEmits<{
  go: [id: string]
}>()
</script>

<template>
  <ol class="flex gap-2 sm:gap-3" data-test="stepper">
    <li v-for="(step, index) in steps" :key="step.id" class="min-w-0 flex-1">
      <button
        type="button"
        class="group flex min-h-11 w-full cursor-pointer flex-col gap-2 rounded-md py-1 text-left focus-visible:shadow-focus-ring focus-visible:outline-none"
        :aria-current="index === currentIndex ? 'step' : undefined"
        :data-test="`stepper-${step.id}`"
        @click="emit('go', step.id)"
      >
        <!-- The track fills on the springy curve, so moving on feels like the bar grows into place. -->
        <span class="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <span
            class="absolute inset-0 origin-left rounded-full transition-[scale,background-color] duration-700 ease-spring motion-reduce:transition-none"
            :class="[
              index <= currentIndex ? 'scale-x-100' : 'scale-x-0',
              index < currentIndex ? 'bg-sprout' : 'bg-primary',
            ]"
          />
        </span>

        <span class="flex min-w-0 items-center gap-2">
          <!-- The number turns into a check once you're past the step; the key replays the pop. -->
          <span
            :key="index < currentIndex ? 'done' : 'todo'"
            class="grid size-5 flex-none place-items-center rounded-full text-caption font-bold transition-colors duration-250 motion-safe:animate-pop"
            :class="
              index < currentIndex
                ? 'bg-sprout text-on-sprout'
                : index === currentIndex
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-sunken text-ink-muted'
            "
          >
            <BaseIcon v-if="index < currentIndex" name="check" :size="12" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="flex min-w-0 flex-col">
            <span
              class="truncate text-label"
              :class="index === currentIndex ? 'text-ink' : 'text-ink-muted group-hover:text-ink'"
            >
              {{ step.label }}
            </span>
            <span
              v-if="index < currentIndex && step.summary"
              class="hidden truncate text-caption font-normal text-ink-subtle sm:block"
              :data-test="`stepper-summary-${step.id}`"
            >
              {{ step.summary }}
            </span>
          </span>
        </span>
      </button>
    </li>
  </ol>
</template>
