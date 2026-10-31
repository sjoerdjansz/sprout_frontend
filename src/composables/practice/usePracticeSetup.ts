import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/lib/api'
import {
  isPracticeModeId,
  practiceMode,
  practiceModes,
  type PracticeModeId,
} from '@/lib/practiceModes'
import {
  availableModes,
  buildBlocks,
  scopeTitle,
  unavailableReason,
  type PracticeBlock,
  type PracticeOptions,
  type PracticeScope,
} from '@/lib/practiceSession'
import { usePracticeStore } from '@/stores/practice'
import { useTopicsStore, type Topic } from '@/stores/topics'

export type LoadState = 'loading' | 'loaded' | 'failed'

export interface PracticeSetup {
  libraryState: Ref<LoadState>
  libraryError: Ref<string>
  materialState: Ref<LoadState>
  materialError: Ref<string>
  topics: ComputedRef<Topic[]>
  topicId: Ref<number>
  subtopicId: Ref<number | null>
  modes: Ref<PracticeModeId[]>
  cardCount: Ref<number>
  questionCount: Ref<number>
  dueFirst: Ref<boolean>
  interleave: Ref<boolean>
  scope: ComputedRef<PracticeScope | null>
  unavailable: ComputedRef<Partial<Record<PracticeModeId, string>>>
  blocks: ComputedRef<PracticeBlock[]>
  scopeLabel: ComputedRef<string>
  orderLabel: ComputedRef<string | null>
  showWholeTopicTip: ComputedRef<boolean>
  loadLibrary: () => Promise<void>
  loadMaterial: () => Promise<void>
  start: () => void
}

/**
 * The practice setup page's state: your library, the scope, modes and amounts you pick, and the
 * cards and questions of that scope, which decide which modes can run
 * (`../specs/practice-session.md`). It opens prefilled from the URL
 * (`?subtopic=26&modes=cards,retrieval`, or `?topic=8`).
 */
export function usePracticeSetup(): PracticeSetup {
  const route = useRoute()
  const router = useRouter()
  const topicsStore = useTopicsStore()
  const practiceStore = usePracticeStore()

  const libraryState = ref<LoadState>('loading')
  const libraryError = ref('')
  const materialState = ref<LoadState>('loading')
  const materialError = ref('')

  const topicId = ref(0)
  const subtopicId = ref<number | null>(null)
  const modes = ref<PracticeModeId[]>(['cards'])
  const cardCount = ref(practiceMode('cards').defaultSize)
  const questionCount = ref(practiceMode('retrieval').defaultSize)
  const dueFirst = ref(true)
  const interleave = ref(true)

  const topics = computed<Topic[]>(() => topicsStore.topics)

  const scope = computed<PracticeScope | null>(() => {
    const topic = topics.value.find((each) => each.id === topicId.value)
    if (topic === undefined) {
      return null
    }
    const subtopic = topic.subtopics.find((each) => each.id === subtopicId.value) ?? null

    return {
      topicId: topic.id,
      topicTitle: topic.title,
      subtopic,
      subtopics: subtopic === null ? topic.subtopics : [subtopic],
    }
  })

  const options = computed<PracticeOptions>(() => ({
    modes: modes.value,
    cardCount: cardCount.value,
    questionCount: questionCount.value,
    dueFirst: dueFirst.value,
    interleave: interleave.value,
  }))

  const unavailable = computed<Partial<Record<PracticeModeId, string>>>(() => {
    const currentScope = scope.value
    if (currentScope === null || materialState.value !== 'loaded') {
      return {}
    }

    const reasons: Partial<Record<PracticeModeId, string>> = {}
    for (const mode of practiceModes) {
      const reason = unavailableReason(mode.id, currentScope, practiceStore.material)
      if (reason !== null) {
        reasons[mode.id] = reason
      }
    }

    return reasons
  })

  const blocks = computed<PracticeBlock[]>(() =>
    scope.value === null || materialState.value !== 'loaded'
      ? []
      : buildBlocks(scope.value, practiceStore.material, options.value),
  )

  const scopeLabel = computed<string>(() =>
    scope.value === null ? '' : scopeTitle(scope.value, options.value),
  )

  const hasSizedMode = computed<boolean>(() =>
    modes.value.some((mode) => practiceMode(mode).unit !== null),
  )

  const orderLabel = computed<string | null>(() => {
    if (!hasSizedMode.value) {
      return null
    }
    const due = dueFirst.value ? 'due first' : 'shuffled'
    if (scope.value?.subtopic !== null) {
      return dueFirst.value ? 'Due first' : 'Shuffled'
    }

    return interleave.value ? `Mixed subtopics, ${due}` : `One subtopic at a time, ${due}`
  })

  const showWholeTopicTip = computed<boolean>(
    () => scope.value !== null && scope.value.subtopic === null && hasSizedMode.value,
  )

  function prefillFromUrl(): void {
    const subtopicFromUrl = Number(route.query.subtopic)
    const topicWithSubtopic = topics.value.find((topic) =>
      topic.subtopics.some((subtopic) => subtopic.id === subtopicFromUrl),
    )
    const topicFromUrl = topics.value.find((topic) => topic.id === Number(route.query.topic))
    const topic = topicWithSubtopic ?? topicFromUrl ?? topics.value[0]

    topicId.value = topic?.id ?? 0
    subtopicId.value = topicWithSubtopic === undefined ? null : subtopicFromUrl

    const modesFromUrl = String(route.query.modes ?? '')
      .split(',')
      .filter(isPracticeModeId)
    if (modesFromUrl.length > 0) {
      modes.value = modesFromUrl
    }
  }

  async function loadLibrary(): Promise<void> {
    libraryState.value = 'loading'

    try {
      await topicsStore.fetchLibrary()
      prefillFromUrl()
      libraryState.value = 'loaded'
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      libraryError.value = caught.message
      libraryState.value = 'failed'
    }
  }

  // Keeps the modes that can run on this scope; when none of them can, the first one that can.
  function keepAvailableModes(): void {
    if (scope.value === null) {
      return
    }
    const available = availableModes(scope.value, practiceStore.material)
    const kept = modes.value.filter((mode) => available.includes(mode))
    const fallback = available[0]
    modes.value = kept.length > 0 || fallback === undefined ? kept : [fallback]
  }

  async function loadMaterial(): Promise<void> {
    if (scope.value === null) {
      return
    }
    const subtopicIds = scope.value.subtopics.map((subtopic) => subtopic.id)
    materialState.value = 'loading'

    try {
      await practiceStore.loadMaterial(subtopicIds)
      // Another scope was picked while this one loaded; its own load finishes the job.
      const current = scope.value?.subtopics.map((subtopic) => subtopic.id) ?? []
      if (current.join() !== subtopicIds.join()) {
        return
      }
      keepAvailableModes()
      materialState.value = 'loaded'
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      materialError.value = caught.message
      materialState.value = 'failed'
    }
  }

  watch(
    () => scope.value?.subtopics.map((subtopic) => subtopic.id).join(),
    () => void loadMaterial(),
  )

  function start(): void {
    if (scope.value === null) {
      return
    }
    practiceStore.start(scope.value, options.value)
    void router.push({ name: 'practice-session' })
  }

  return {
    libraryState,
    libraryError,
    materialState,
    materialError,
    topics,
    topicId,
    subtopicId,
    modes,
    cardCount,
    questionCount,
    dueFirst,
    interleave,
    scope,
    unavailable,
    blocks,
    scopeLabel,
    orderLabel,
    showWholeTopicTip,
    loadLibrary,
    loadMaterial,
    start,
  }
}
