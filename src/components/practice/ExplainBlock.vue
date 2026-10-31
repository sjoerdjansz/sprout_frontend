<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import FeynmanCard from '@/components/FeynmanCard.vue'
import FormError from '@/components/FormError.vue'
import ExplainFeedback from '@/components/practice/ExplainFeedback.vue'
import { ApiError } from '@/lib/api'
import type { ExplainConcept, Explanation } from '@/lib/practiceSession'
import { usePracticeStore } from '@/stores/practice'

const { concept, explanations } = defineProps<{
  concept: ExplainConcept
  /** What you explained so far in this block (also before a reload). */
  explanations: Explanation[]
}>()

const emit = defineEmits<{
  finish: []
}>()

const practice = usePracticeStore()

/** Step 1 (the concept) is picked by the session, so the block opens on step 2. */
type Step = 2 | 3 | 4

const steps: { name: string; caption: string }[] = [
  { name: 'Pick a concept', caption: concept.subtopicTitle },
  { name: 'Explain it simply', caption: 'In your own words' },
  { name: 'Find the gaps', caption: 'Sprout asks back' },
  { name: 'Simplify', caption: 'Say it again, shorter' },
]

// A session picked up again goes on after your first version.
const savedFirst = explanations.find((explanation) => explanation.version === 1)
const step = ref<Step>(savedFirst === undefined ? 2 : 3)
const firstVersion = ref(savedFirst?.text ?? '')
const first = ref<Explanation | null>(savedFirst ?? null)
const secondVersion = ref('')
const second = ref<Explanation | null>(null)
const checking = ref(false)
const checkError = ref<string | null>(null)

function wordCount(text: string): number {
  const trimmed = text.trim()

  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

// Enough words for Sprout to find real gaps, without asking for an essay.
const minimumFirst = 12
const minimumSecond = 8

const firstWords = computed<number>(() => wordCount(firstVersion.value))
const secondWords = computed<number>(() => wordCount(secondVersion.value))

// Sprout takes a few seconds; if it can't answer, nothing was stored and your text stays.
async function check(version: 1 | 2): Promise<void> {
  const text = (version === 1 ? firstVersion.value : secondVersion.value).trim()
  checking.value = true
  checkError.value = null

  try {
    const answer = await practice.explain(concept.subtopicId, text, version)
    const checked: Explanation = {
      version,
      text,
      feedback: answer.feedback,
      gaps: answer.gaps ?? [],
    }
    if (version === 1) {
      first.value = checked
      step.value = 3
    } else {
      second.value = checked
    }
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    checkError.value = caught.message
  } finally {
    checking.value = false
  }
}

function toSimplify(): void {
  checkError.value = null
  step.value = 4
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
        questions you’ll be asked next.
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
          :disabled="checking"
          data-test="first-version"
        />
        <p class="text-caption font-normal text-ink-subtle" aria-live="polite">
          {{ firstWords }} words<template v-if="firstWords < minimumFirst">
            · a bit more detail helps Sprout find real gaps</template
          >
        </p>
        <p v-if="checking" class="text-body text-ink-muted" aria-live="polite">
          Sprout is reading your explanation…
        </p>
        <FormError v-if="checkError" :message="checkError" />
        <div class="flex justify-end">
          <BaseButton
            size="lg"
            icon-right="arrow-right"
            :disabled="firstWords < minimumFirst || checking"
            data-test="find-gaps"
            @click="check(1)"
          >
            {{ checking ? 'Finding the gaps…' : 'Find the gaps' }}
          </BaseButton>
        </div>
      </template>

      <template v-else-if="step === 3 && first">
        <div class="flex flex-col gap-1.5">
          <span class="text-overline text-sun-ink">STEP 3 · FIND THE GAPS</span>
          <h1 class="font-display text-title-lg text-ink">
            {{
              first.gaps.length > 0 ? 'Close the gaps before you rewrite.' : 'No gaps this time.'
            }}
          </h1>
        </div>
        <FeynmanCard :explanation="first.text" :gaps="first.gaps" />
        <ExplainFeedback v-if="first.feedback" :feedback="first.feedback" />
        <div class="flex justify-end">
          <BaseButton size="lg" icon="pencil" data-test="to-simplify" @click="toSimplify">
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
            :disabled="second !== null || checking"
            data-test="second-version"
          />
        </div>
        <template v-if="second">
          <ExplainFeedback v-if="second.feedback" :feedback="second.feedback" />
          <FeynmanCard
            v-if="second.gaps.length > 0"
            title="Your second version"
            :explanation="second.text"
            :gaps="second.gaps"
          />
        </template>
        <p v-if="checking" class="text-body text-ink-muted" aria-live="polite">
          Sprout is reading your explanation…
        </p>
        <FormError v-if="checkError" :message="checkError" />
        <div class="flex justify-end">
          <BaseButton
            v-if="second"
            size="lg"
            icon="check"
            data-test="finish-explain"
            @click="emit('finish')"
          >
            Done explaining
          </BaseButton>
          <BaseButton
            v-else
            size="lg"
            icon="sparkles"
            :disabled="secondWords < minimumSecond || checking"
            data-test="check-second"
            @click="check(2)"
          >
            {{ checking ? 'Checking…' : 'Check my explanation' }}
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
