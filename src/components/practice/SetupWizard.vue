<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import SetupStepper, { type WizardStep } from '@/components/practice/SetupStepper.vue'

type Direction = 'forward' | 'back'

const { steps, canAdvance = true } = defineProps<{
  steps: WizardStep[]
  /** Off while the current step needs an answer before you can move on. */
  canAdvance?: boolean
}>()

/** The id of the step you're on; each step's content comes from the slot with that name. */
const currentId = defineModel<string>({ required: true })

const currentIndex = computed<number>(() =>
  Math.max(
    0,
    steps.findIndex((step) => step.id === currentId.value),
  ),
)
const current = computed<WizardStep | undefined>(() => steps[currentIndex.value])
const previous = computed<WizardStep | undefined>(() => steps[currentIndex.value - 1])
const next = computed<WizardStep | undefined>(() => steps[currentIndex.value + 1])

const direction = ref<Direction>('forward')
const viewport = ref<HTMLElement | null>(null)
/** Pinned while the steps swap, so the card glides to the new step's height instead of jumping. */
const height = ref<number | null>(null)
const animating = ref<boolean>(false)
const announcement = ref<string>('')

/*
 * A card turn: the step you leave tilts away and blurs out, the next one swings in from the other
 * side and lands on the springy curve. Going back mirrors it. With reduced motion only the fade is
 * left. The leaving step is taken out of the flow so the card can take the new step's height.
 */
const transitionClasses = computed<Record<string, string>>(() => {
  const forward = direction.value === 'forward'

  return {
    enterActiveClass:
      'transition-opacity duration-150 motion-safe:transition-[opacity,translate,scale,transform,filter] motion-safe:duration-500 motion-safe:ease-spring',
    enterFromClass: forward
      ? 'opacity-0 motion-safe:translate-x-12 motion-safe:scale-95 motion-safe:rotate-y-12 motion-safe:blur-sm'
      : 'opacity-0 motion-safe:-translate-x-12 motion-safe:scale-95 motion-safe:-rotate-y-12 motion-safe:blur-sm',
    leaveActiveClass:
      'pointer-events-none absolute inset-x-0 top-0 transition-opacity duration-150 motion-safe:transition-[opacity,translate,scale,transform,filter] motion-safe:duration-300 motion-safe:ease-default',
    leaveToClass: forward
      ? 'opacity-0 motion-safe:-translate-x-10 motion-safe:scale-95 motion-safe:-rotate-y-12 motion-safe:blur-sm'
      : 'opacity-0 motion-safe:translate-x-10 motion-safe:scale-95 motion-safe:rotate-y-12 motion-safe:blur-sm',
  }
})

// Runs before the render that swaps the steps, so the transition picks up the right direction.
watch(
  currentIndex,
  (nextIndex, previousIndex) => {
    direction.value = nextIndex >= previousIndex ? 'forward' : 'back'
  },
  { flush: 'pre' },
)

// Moving on takes your focus to the new question, so keyboard and screen reader users land there.
watch(currentId, async (id) => {
  const step = current.value
  if (step !== undefined) {
    announcement.value = `Step ${currentIndex.value + 1} of ${steps.length}: ${step.title}`
  }
  await nextTick()
  viewport.value?.querySelector<HTMLElement>(`[data-step-panel="${id}"] h2`)?.focus()
})

function go(id: string): void {
  currentId.value = id
}

function onBeforeLeave(): void {
  if (viewport.value === null) {
    return
  }
  height.value = viewport.value.offsetHeight
  animating.value = true
}

function onEnter(element: Element): void {
  // A frame later, so the pinned height has been painted and the change animates.
  requestAnimationFrame(() => {
    if (element instanceof HTMLElement) {
      height.value = element.offsetHeight
    }
  })
}

function onSettled(): void {
  height.value = null
  animating.value = false
}
</script>

<template>
  <section
    :aria-labelledby="current ? `step-${current.id}` : undefined"
    class="flex flex-col gap-5 rounded-xl border border-line bg-surface p-4 shadow-sm sm:px-6 sm:py-5"
    data-test="setup-wizard"
  >
    <SetupStepper :steps="steps" :current-index="currentIndex" @go="go" />

    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <div
      ref="viewport"
      class="relative perspective-distant transition-[height] duration-500 ease-default motion-reduce:transition-none"
      :class="{ 'overflow-hidden': animating }"
      :style="height === null ? undefined : { height: `${height}px` }"
    >
      <Transition
        v-bind="transitionClasses"
        @before-leave="onBeforeLeave"
        @enter="onEnter"
        @after-enter="onSettled"
        @enter-cancelled="onSettled"
      >
        <div
          v-if="current"
          :key="current.id"
          class="flex flex-col gap-3.5"
          :data-step-panel="current.id"
          :data-test="`step-${current.id}`"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-overline text-ink-subtle">
              STEP {{ currentIndex + 1 }} OF {{ steps.length }}
            </span>
            <h2
              :id="`step-${current.id}`"
              tabindex="-1"
              class="font-display text-title text-ink focus-visible:shadow-none"
            >
              {{ current.title }}
            </h2>
          </div>
          <slot :name="current.id" />
        </div>
      </Transition>
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-line pt-4">
      <BaseButton
        v-if="previous"
        variant="ghost"
        icon="chevron-left"
        data-test="wizard-back"
        @click="go(previous.id)"
      >
        Back
      </BaseButton>
      <span v-else />

      <BaseButton
        v-if="next"
        variant="secondary"
        icon-right="arrow-right"
        :disabled="!canAdvance"
        data-test="wizard-next"
        @click="go(next.id)"
      >
        Next: {{ next.label }}
      </BaseButton>
      <!-- The last step ends in what the wizard is for, e.g. starting the session. -->
      <slot v-else name="finish" />
    </div>
  </section>
</template>
