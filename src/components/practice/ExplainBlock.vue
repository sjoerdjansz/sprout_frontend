<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import type { ExplainConcept } from '@/lib/practiceSession'

const { concept } = defineProps<{
  concept: ExplainConcept
}>()

const emit = defineEmits<{
  explain: [text: string]
  finish: []
}>()

/** Step 1 (the concept) is picked by the session, so the block opens on step 2. */
type Step = 2 | 3 | 4

const steps: { name: string; caption: string }[] = [
  { name: 'Pick a concept', caption: concept.subtopicTitle },
  { name: 'Explain it simply', caption: 'In your own words' },
  { name: 'Compare', caption: 'With your cards' },
  { name: 'Simplify', caption: 'Say it again, shorter' },
]

const step = ref<Step>(2)
const firstVersion = ref('')
const secondVersion = ref('')

function wordCount(text: string): number {
  const trimmed = text.trim()

  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

// Enough words to have something to compare, without asking for an essay.
const minimumFirst = 12
const minimumSecond = 8

const firstWords = computed<number>(() => wordCount(firstVersion.value))
const secondWords = computed<number>(() => wordCount(secondVersion.value))

function compare(): void {
  emit('explain', firstVersion.value.trim())
  step.value = 3
}

function finish(): void {
  emit('explain', secondVersion.value.trim())
  emit('finish')
}

function stepClasses(index: number): { chip: string; dot: string } {
  const number = index + 1
  if (number < step.value) {
    return { chip: 'text-ink', dot: 'bg-sprout text-on-sprout' }
  }
  if (number === step.value) {
    return { chip: 'bg-sun-soft text-ink', dot: 'bg-sun text-on-sun' }
  }

  return { chip: 'text-ink-subtle', dot: 'bg-surface-sunken text-ink-subtle' }
}
</script>

<template>
  <main
    class="flex grow flex-col justify-center gap-6 px-4 py-6 sm:px-8 lg:flex-row"
    data-test="explain-block"
  >
    <aside
      aria-label="Steps"
      class="mx-auto flex w-full max-w-190 flex-col gap-1.5 lg:mx-0 lg:w-60 lg:flex-none"
    >
      <!-- A compact row on narrow screens, a rail with captions next to the work on wide ones. -->
      <ol class="flex flex-wrap gap-1.5 lg:flex-col">
        <li
          v-for="(each, index) in steps"
          :key="each.name"
          class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-body"
          :class="stepClasses(index).chip"
          :aria-current="index + 1 === step ? 'step' : undefined"
        >
          <span
            class="grid size-6 flex-none place-items-center rounded-full text-caption font-bold"
            :class="stepClasses(index).dot"
          >
            <BaseIcon v-if="index + 1 < step" name="check" :size="14" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="flex flex-col">
            <b>{{ each.name }}</b>
            <span class="hidden text-caption font-normal opacity-80 lg:inline">{{
              each.caption
            }}</span>
          </span>
        </li>
      </ol>
      <p class="mt-3 hidden rounded-md bg-surface-tint px-3.5 py-3 text-label font-normal lg:block">
        <b class="block text-sprout-ink">Why this works</b>
        If you can’t explain it simply, you don’t understand it yet. The gaps you find here are the
        questions to ask next.
      </p>
    </aside>

    <section class="mx-auto flex w-full max-w-190 min-w-0 flex-col gap-4 lg:mx-0">
      <template v-if="step === 2">
        <div class="flex flex-col gap-1.5">
          <span class="text-overline text-sun-ink">STEP 2 · EXPLAIN IT SIMPLY</span>
          <h1 class="font-display text-title-lg text-ink" data-test="explain-prompt">
            {{ concept.prompt }}
          </h1>
          <p class="text-body text-ink-muted">
            Plain words, no jargon. Don’t look anything up; that’s the point. Aim for 4 to 8
            sentences.
          </p>
        </div>
        <BaseTextarea
          v-model="firstVersion"
          label="Your explanation"
          rows="8"
          placeholder="Start with what it’s for…"
          data-test="first-version"
        />
        <p class="text-caption font-normal text-ink-subtle" aria-live="polite">
          {{ firstWords }} words<template v-if="firstWords < minimumFirst">
            · a little more helps you find real gaps</template
          >
        </p>
        <div class="flex justify-end">
          <BaseButton
            size="lg"
            icon-right="arrow-right"
            :disabled="firstWords < minimumFirst"
            data-test="compare"
            @click="compare"
          >
            Compare with my cards
          </BaseButton>
        </div>
      </template>

      <template v-else-if="step === 3">
        <div class="flex flex-col gap-1.5">
          <span class="text-overline text-sun-ink">STEP 3 · COMPARE</span>
          <h1 class="font-display text-title-lg text-ink">Which of these did you leave out?</h1>
          <p class="text-body text-ink-muted">
            Sprout will point out the gaps itself once it can check explanations. Until then,
            compare yours with the answers on your cards.
          </p>
        </div>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3.5">
          <div class="rounded-md bg-surface-sunken px-4 py-3.5 text-body text-ink-muted">
            <b class="mb-1 block text-ink">Your explanation</b>
            {{ firstVersion }}
          </div>
          <div class="rounded-md bg-surface-tint px-4 py-3.5 text-body" data-test="key-points">
            <b class="mb-1 block text-sprout-ink">From your cards</b>
            <ul v-if="concept.keyPoints.length > 0" class="flex list-disc flex-col gap-1 pl-5">
              <li v-for="point in concept.keyPoints" :key="point">{{ point }}</li>
            </ul>
            <p v-else class="text-ink-muted">
              This subtopic has no cards yet. Read your explanation once more and look for the step
              you skipped.
            </p>
          </div>
        </div>
        <div class="flex justify-end">
          <BaseButton size="lg" icon="pencil" data-test="to-simplify" @click="step = 4">
            Rewrite it simpler
          </BaseButton>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-1.5">
          <span class="text-overline text-sun-ink">STEP 4 · SIMPLIFY</span>
          <h1 class="font-display text-title-lg text-ink">
            Now say it again, shorter and with the gaps filled.
          </h1>
        </div>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3.5">
          <div class="rounded-md bg-surface-sunken px-4 py-3.5 text-body text-ink-muted">
            <b class="mb-1 block text-ink">Your first version</b>
            {{ firstVersion }}
          </div>
          <BaseTextarea
            v-model="secondVersion"
            label="Your second version"
            rows="6"
            placeholder="Shorter. Plainer. With what you left out."
            data-test="second-version"
          />
        </div>
        <div class="flex justify-end">
          <BaseButton
            size="lg"
            icon="check"
            :disabled="secondWords < minimumSecond"
            data-test="finish-explain"
            @click="finish"
          >
            Done explaining
          </BaseButton>
        </div>
      </template>
    </section>
  </main>

  <footer class="flex flex-none justify-end border-t border-line bg-surface px-4 py-3 sm:px-8">
    <BaseButton variant="secondary" size="sm" data-test="finish-block" @click="emit('finish')">
      Finish early
    </BaseButton>
  </footer>
</template>
