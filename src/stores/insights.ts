import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, api } from '@/lib/api'

/*
 * The Insights page (`../specs/insights.md`, `../API.md` "GET /insights", "GET /insights/activity"
 * and "GET /insights/topics"). Each part loads and fails on its own, so each has its own state.
 * Mastery, subtopics and facets come from the topics store (`GET /topics`), not from here.
 */

/** This week = the last 7 days, this month = the last 30 days, both today included. */
export type InsightsPeriod = 'week' | 'month' | 'all'

export interface Streak {
  current_days: number
  best_days: number
}

export interface RecallRate {
  /** 0–100; null when there was nothing to count in the period. */
  percentage: number | null
  /** Null for `all`, or when there was nothing to count in the period before. */
  previous_percentage: number | null
  /** `percentage` minus `previous_percentage`; null when either is null. */
  change_points: number | null
}

export interface TopicStudyTime {
  id: number
  title: string
  minutes: number
}

export interface StudyTime {
  minutes: number
  /** Null for `all`. */
  previous_minutes: number | null
  /** Can be negative; null for `all`. */
  change_minutes: number | null
  /** Most first, only topics with at least one minute. */
  topics: TopicStudyTime[]
}

export interface LeafSource {
  count: number
  leaves: number
}

export interface Leaves {
  /** Everything you ever earned, whatever the period. */
  total: number
  earned: number
  /** Null for `all`. */
  previous_earned: number | null
  /** Null for `all`. */
  change: number | null
  /** They always add up to `earned`. */
  sources: Record<'cards' | 'questions' | 'explanations', LeafSource>
}

/** `GET /insights?period=` (and `GET /insights/week`, which is the same as `period=week`). */
export interface PeriodInsights {
  period: InsightsPeriod
  /** YYYY-MM-DD in your timezone. For `all` the first day you practised, null before any practice. */
  from: string | null
  to: string
  streak: Streak
  recall_rate: RecallRate
  study_time: StudyTime
  leaves: Leaves
}

export interface ActivityDay {
  /** YYYY-MM-DD */
  date: string
  cards_reviewed: number
  questions_answered: number
  leaves: number
  minutes: number
}

export type Weekday =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface ActivitySummary {
  active_days: number
  longest_streak_days: number
  /** Null without any active days. */
  average_minutes_per_active_day: number | null
  /** Null without any active days. */
  best_weekday: Weekday | null
}

/** `GET /insights/activity`: the last 365 days. */
export interface Activity {
  from: string
  to: string
  /** Only the days you practised, oldest first. */
  days: ActivityDay[]
  summary: ActivitySummary
}

/** One topic in `GET /insights/topics`; join it with `GET /topics` on `id` for its mastery. */
export interface TopicInsight {
  id: number
  title: string
  study_minutes: number
  card_count: number
}

/** Whether one part of the page is loading, and why it failed (the API's message). */
export interface SectionState {
  loading: boolean
  error: string | null
}

function idle(): SectionState {
  return { loading: false, error: null }
}

export const useInsightsStore = defineStore('insights', () => {
  /** One answer per period: switching back to a tab you've seen doesn't load it again. */
  const periods = ref<Partial<Record<InsightsPeriod, PeriodInsights>>>({})
  const periodStates = ref<Record<InsightsPeriod, SectionState>>({
    week: idle(),
    month: idle(),
    all: idle(),
  })

  const activity = ref<Activity | null>(null)
  const activityState = ref<SectionState>(idle())

  const topicInsights = ref<TopicInsight[] | null>(null)
  const topicInsightsState = ref<SectionState>(idle())

  /*
   * Runs one request for a part of the page and keeps its state. An API error is kept for the
   * page to show with a retry; anything else is a bug and propagates.
   */
  async function load<T>(
    state: SectionState,
    request: () => Promise<T>,
    keep: (result: T) => void,
  ): Promise<void> {
    state.loading = true
    state.error = null

    try {
      keep(await request())
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      state.error = caught.message
    } finally {
      state.loading = false
    }
  }

  async function fetchPeriod(period: InsightsPeriod): Promise<void> {
    const state = periodStates.value[period]
    if (periods.value[period] !== undefined || state.loading) {
      return
    }

    await load(
      state,
      () => api<PeriodInsights>(`/insights?period=${period}`),
      (result) => {
        periods.value[period] = result
      },
    )
  }

  /** Opening the page again shows what you practised since; switching tabs on it doesn't. */
  function forgetPeriods(): void {
    periods.value = {}
  }

  async function fetchActivity(): Promise<void> {
    await load(
      activityState.value,
      () => api<Activity>('/insights/activity'),
      (result) => {
        activity.value = result
      },
    )
  }

  async function fetchTopicInsights(): Promise<void> {
    await load(
      topicInsightsState.value,
      () => api<TopicInsight[]>('/insights/topics'),
      (result) => {
        topicInsights.value = result
      },
    )
  }

  return {
    periods,
    periodStates,
    activity,
    activityState,
    topicInsights,
    topicInsightsState,
    fetchPeriod,
    forgetPeriods,
    fetchActivity,
    fetchTopicInsights,
  }
})
