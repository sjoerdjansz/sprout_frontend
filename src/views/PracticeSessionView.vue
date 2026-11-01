<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseBadge from '@/components/BaseBadge.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import ExplainBlock from '@/components/practice/ExplainBlock.vue'
import FlashcardBlock from '@/components/practice/FlashcardBlock.vue'
import NextUp from '@/components/practice/NextUp.vue'
import OpenBlock from '@/components/practice/OpenBlock.vue'
import QuizBlock from '@/components/practice/QuizBlock.vue'
import PracticeTopBar from '@/components/practice/PracticeTopBar.vue'
import SessionDone from '@/components/practice/SessionDone.vue'
import SessionHeader, { type BlockProgress } from '@/components/practice/SessionHeader.vue'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { cardsDone } from '@/lib/practiceSession'
import { usePracticeStore } from '@/stores/practice'

/*
 * A practice session, block by block (`../specs/practice-session.md`): each block, "Next up"
 * between blocks and the results at the end are phases of this one page, so the back button
 * never drops you halfway into a block. The plan comes from the setup page; after a reload (or
 * a typed URL) the session still going today is picked up again, otherwise you go to the setup.
 */

const router = useRouter()
const practice = usePracticeStore()
const { toast, showToast } = useToast()

type ResumeState = 'ready' | 'resuming' | 'failed'
const resumeState = ref<ResumeState>(practice.plan === null ? 'resuming' : 'ready')
const resumeError = ref('')

const blockLabel = computed<string | null>(() => {
  const blocks = practice.plan?.blocks.length ?? 0

  return blocks > 1 ? `Block ${practice.blockIndex + 1} of ${blocks}` : null
})

const nextBlockLabel = computed<string>(
  () => `Block ${practice.blockIndex + 2} of ${practice.plan?.blocks.length ?? 0}`,
)

const subtopicTitles = computed<Record<number, string>>(() =>
  Object.fromEntries(
    (practice.plan?.scope.subtopics ?? []).map((subtopic) => [subtopic.id, subtopic.title]),
  ),
)

const progress = computed<BlockProgress | null>(() => {
  const block = practice.currentBlock
  const result = practice.currentResult
  if (block === null || result === null) {
    return null
  }

  switch (block.mode) {
    case 'cards': {
      const done = cardsDone(result.ratings)
      return { done, total: block.cards.length, text: `${done} of ${block.cards.length}` }
    }
    case 'retrieval': {
      const total = block.questions.length
      const current = Math.min(result.answers.length + 1, total)
      return { done: result.answers.length, total, text: `Question ${current} of ${total}` }
    }
    default:
      return null
  }
})

const streakDays = computed<number>(() => practice.session?.streak_days ?? 0)

/**
 * Runs a step that may finish the session on the API (End session, Finish here, the last
 * block). If that fails you stay where you are, with the API's message, and can try again.
 */
async function finishing(step: () => Promise<void>): Promise<void> {
  try {
    await step()
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    showToast({
      title: 'Your session isn’t finished yet',
      message: caught.message,
      tone: 'ember',
      icon: 'rotate-ccw',
    })
  }
}

async function resume(): Promise<void> {
  resumeState.value = 'resuming'
  try {
    const resumed = await practice.resume()
    if (!resumed) {
      void router.replace({ name: 'practice' })
      return
    }
    resumeState.value = 'ready'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    resumeError.value = caught.message
    resumeState.value = 'failed'
  }
}

function goHome(): void {
  void router.push({ name: 'home' })
}

// Back to the setup with the same scope and modes, to go again.
function practiseAgain(): void {
  const plan = practice.plan
  if (plan === null) {
    return
  }
  const query: Record<string, string> = {
    modes: plan.blocks.map((block) => block.mode).join(','),
  }
  if (plan.scope.subtopic === null) {
    query.topic = String(plan.scope.topicId)
  } else {
    query.subtopic = String(plan.scope.subtopic.id)
  }
  void router.push({ name: 'practice', query })
}

function openSubtopic(subtopicId: number): void {
  void router.push({ name: 'subtopic', params: { id: subtopicId } })
}

onMounted(() => {
  if (practice.plan === null) {
    void resume()
  }
})

// Leaving clears this page's copy; a session that's still going can be picked up again.
onBeforeUnmount(() => practice.reset())
</script>

<template>
  <div v-if="resumeState !== 'ready'" class="flex min-h-svh flex-col bg-canvas text-ink">
    <PracticeTopBar />
    <main class="flex grow items-center justify-center px-4 py-8 sm:px-8">
      <p v-if="resumeState === 'resuming'" class="text-ink-muted" aria-live="polite">
        Picking up your session…
      </p>
      <div v-else class="flex flex-col items-start gap-4">
        <FormError :message="resumeError" />
        <BaseButton variant="secondary" icon="rotate-ccw" @click="resume">Try again</BaseButton>
      </div>
    </main>
  </div>

  <div v-else-if="practice.plan" class="flex min-h-svh flex-col bg-canvas text-ink">
    <template v-if="practice.phase === 'block' && practice.currentBlock && practice.currentResult">
      <SessionHeader
        :mode="practice.currentBlock.mode"
        :title="practice.plan.title"
        :block-label="blockLabel"
        :progress="progress"
        @end="finishing(practice.end)"
      />

      <FlashcardBlock
        v-if="practice.currentBlock.mode === 'cards'"
        :key="`cards-${practice.blockIndex}`"
        :cards="practice.currentBlock.cards"
        :ratings="practice.currentResult.ratings"
        :subtopic-titles="subtopicTitles"
        @finish="finishing(practice.finishBlock)"
      />
      <QuizBlock
        v-else-if="practice.currentBlock.mode === 'retrieval'"
        :key="`retrieval-${practice.blockIndex}`"
        :questions="practice.currentBlock.questions"
        :answers="practice.currentResult.answers"
        :subtopic-titles="subtopicTitles"
        :second-try="practice.plan.options.secondTry"
        @finish="finishing(practice.finishBlock)"
      />
      <ExplainBlock
        v-else-if="practice.currentBlock.mode === 'feynman'"
        :key="`feynman-${practice.blockIndex}`"
        :concept="practice.currentBlock.concept"
        :explanations="practice.currentResult.explanations"
        @finish="finishing(practice.finishBlock)"
      />
      <OpenBlock
        v-else-if="practice.currentBlock.mode === 'open'"
        :key="`open-${practice.blockIndex}`"
        :topic-title="practice.currentBlock.topicTitle"
        :subtopic-title="practice.currentBlock.subtopicTitle"
        :messages="practice.currentResult.messages"
        @finish="finishing(practice.finishBlock)"
      />
    </template>

    <template v-else-if="practice.phase === 'next' && practice.nextBlock && practice.currentResult">
      <PracticeTopBar :title="practice.plan.title" />
      <NextUp
        :previous="practice.currentResult"
        :next="practice.nextBlock"
        :position="nextBlockLabel"
        @start="practice.startNextBlock"
        @skip="finishing(practice.skipNextBlock)"
        @finish="finishing(practice.end)"
      />
    </template>

    <template v-else-if="practice.phase === 'done'">
      <PracticeTopBar>
        <BaseBadge v-if="streakDays > 0" tone="sun" icon="flame" data-test="done-streak">
          {{ streakDays }}-day streak
        </BaseBadge>
      </PracticeTopBar>
      <SessionDone
        :plan="practice.plan"
        :results="practice.results"
        :session="practice.session"
        @home="goHome"
        @again="practiseAgain"
        @open-subtopic="openSubtopic"
      />
    </template>

    <BaseToast
      v-if="toast !== null"
      :title="toast.title"
      :message="toast.message"
      :tone="toast.tone"
      :icon="toast.icon"
    />
  </div>
</template>
