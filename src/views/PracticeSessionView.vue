<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FlashcardBlock from '@/components/practice/FlashcardBlock.vue'
import NextUp from '@/components/practice/NextUp.vue'
import QuizBlock from '@/components/practice/QuizBlock.vue'
import PracticeTopBar from '@/components/practice/PracticeTopBar.vue'
import SessionDone from '@/components/practice/SessionDone.vue'
import SessionHeader, { type BlockProgress } from '@/components/practice/SessionHeader.vue'
import { cardsDone } from '@/lib/practiceSession'
import { usePracticeStore } from '@/stores/practice'

/*
 * A practice session, block by block (`../specs/practice-session.md`): each block, "Next up"
 * between blocks and the results at the end are phases of this one page, so the back button
 * never drops you halfway into a block. The plan comes from the setup page; without one
 * (a reload, a typed URL) you go back there.
 */

const router = useRouter()
const practice = usePracticeStore()

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

const minutes = computed<number>(() => {
  const start = practice.startedAt?.getTime() ?? 0
  const end = practice.endedAt?.getTime() ?? start

  return Math.max(1, Math.round((end - start) / 60_000))
})

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
    void router.replace({ name: 'practice' })
  }
})

// Results only live in this session, so leaving it starts the next one fresh.
onBeforeUnmount(() => practice.reset())
</script>

<template>
  <div v-if="practice.plan" class="flex min-h-svh flex-col bg-canvas text-ink">
    <template v-if="practice.phase === 'block' && practice.currentBlock && practice.currentResult">
      <SessionHeader
        :mode="practice.currentBlock.mode"
        :title="practice.plan.title"
        :block-label="blockLabel"
        :progress="progress"
        @end="practice.end"
      />

      <FlashcardBlock
        v-if="practice.currentBlock.mode === 'cards'"
        :key="practice.blockIndex"
        :cards="practice.currentBlock.cards"
        :ratings="practice.currentResult.ratings"
        :subtopic-titles="subtopicTitles"
        @rate="practice.rateCard"
        @finish="practice.finishBlock"
      />
      <QuizBlock
        v-else-if="practice.currentBlock.mode === 'retrieval'"
        :key="practice.blockIndex"
        :questions="practice.currentBlock.questions"
        :answers="practice.currentResult.answers"
        :subtopic-titles="subtopicTitles"
        @answer="practice.answerQuestion"
        @finish="practice.finishBlock"
      />
    </template>

    <template v-else-if="practice.phase === 'next' && practice.nextBlock && practice.currentResult">
      <PracticeTopBar :title="practice.plan.title" />
      <NextUp
        :previous="practice.currentResult"
        :next="practice.nextBlock"
        :position="nextBlockLabel"
        @start="practice.startNextBlock"
        @skip="practice.skipNextBlock"
        @finish="practice.end"
      />
    </template>

    <template v-else-if="practice.phase === 'done'">
      <PracticeTopBar />
      <SessionDone
        :plan="practice.plan"
        :results="practice.results"
        :minutes="minutes"
        @home="goHome"
        @again="practiseAgain"
        @open-subtopic="openSubtopic"
      />
    </template>
  </div>
</template>
