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
  builtInDefaults,
  defaultsFromSettings,
  scopeTitle,
  unavailableReason,
  type PracticeBlock,
  type PracticeOptions,
  type PracticeScope,
} from '@/lib/practiceSession'
import { usePracticeStore, type PracticeSession } from '@/stores/practice'
import { useSettingsStore } from '@/stores/settings'
import { useTopicsStore, type Topic } from '@/stores/topics'

export type LoadState = 'loading' | 'loaded' | 'failed'

/** What the "Your session" card shows: the blocks, and the scope and order in words. */
export interface SetupSummary {
  blocks: PracticeBlock[]
  scopeLabel: string
  orderLabel: string | null
}

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
  secondTry: Ref<boolean>
  scope: ComputedRef<PracticeScope | null>
  unavailable: ComputedRef<Partial<Record<PracticeModeId, string>>>
  /** While another scope's cards load, the summary of the last one that loaded. */
  summary: ComputedRef<SetupSummary>
  /** Flashcards or the quiz is on: the only modes with an amount and order to pick. */
  hasSizedMode: ComputedRef<boolean>
  showWholeTopicTip: ComputedRef<boolean>
  /** The session still going today, to pick up instead of starting a new one. */
  current: ComputedRef<PracticeSession | null>
  starting: Ref<boolean>
  startError: Ref<string>
  loadLibrary: () => Promise<void>
  loadMaterial: () => Promise<void>
  start: () => Promise<void>
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
  const settingsStore = useSettingsStore()

  const libraryState = ref<LoadState>('loading')
  const libraryError = ref('')
  const materialState = ref<LoadState>('loading')
  const materialError = ref('')
  const starting = ref(false)
  const startError = ref('')

  const topicId = ref(0)
  const subtopicId = ref<number | null>(null)
  const modes = ref<PracticeModeId[]>(['cards'])
  const cardCount = ref(builtInDefaults.cardCount)
  const questionCount = ref(builtInDefaults.questionCount)
  const dueFirst = ref(true)
  const interleave = ref(builtInDefaults.interleave)
  // Not on the setup page: it comes from your settings ("Hint before the answer").
  const secondTry = ref(builtInDefaults.secondTry)

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
    secondTry: secondTry.value,
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

  // Emptying the card while another scope loads made it shrink and jump back a moment later, so
  // it keeps showing the last loaded summary and swaps in the new one when it's there.
  const summary = computed<SetupSummary>((previous) => {
    if (materialState.value === 'loading' && previous !== undefined) {
      return previous
    }

    return { blocks: blocks.value, scopeLabel: scopeLabel.value, orderLabel: orderLabel.value }
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

  // Your learning defaults from settings. Practice works without them, so if they can't load the
  // session starts from the built-in ones and you can still change every amount here.
  async function applyLearningDefaults(): Promise<void> {
    try {
      const settings = settingsStore.settings ?? (await settingsStore.fetchSettings())
      const defaults = defaultsFromSettings(settings)
      cardCount.value = defaults.cardCount
      questionCount.value = defaults.questionCount
      interleave.value = defaults.interleave
      secondTry.value = defaults.secondTry
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
    }
  }

  // Picking up a session is a shortcut: if it can't be looked up, you can still start a new one.
  async function findCurrentSession(): Promise<void> {
    try {
      await practiceStore.fetchCurrent()
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
    }
  }

  async function loadLibrary(): Promise<void> {
    libraryState.value = 'loading'

    try {
      await Promise.all([topicsStore.fetchLibrary(), applyLearningDefaults(), findCurrentSession()])
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
  // With nothing picked it leaves the choice to you.
  function keepAvailableModes(): void {
    if (scope.value === null || modes.value.length === 0) {
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

  // Starting a new session finishes the one still going on the API.
  async function start(): Promise<void> {
    if (scope.value === null || starting.value) {
      return
    }
    starting.value = true
    startError.value = ''

    try {
      await practiceStore.start(scope.value, options.value)
      void router.push({ name: 'practice-session' })
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      startError.value = caught.message
    } finally {
      starting.value = false
    }
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
    secondTry,
    scope,
    unavailable,
    summary,
    hasSizedMode,
    showWholeTopicTip,
    current: computed<PracticeSession | null>(() => practiceStore.current),
    starting,
    startError,
    loadLibrary,
    loadMaterial,
    start,
  }
}
