import type {
  Activity,
  ActivityDay,
  InsightsPeriod,
  PeriodInsights,
  TopicInsight,
} from '@/stores/insights'

/** `GET /insights?period=week` as in the API.md example. */
export function makePeriodInsights(overrides: Partial<PeriodInsights> = {}): PeriodInsights {
  return {
    period: 'week',
    from: '2026-10-28',
    to: '2026-11-03',
    streak: { current_days: 6, best_days: 14 },
    recall_rate: { percentage: 87, previous_percentage: 84, change_points: 3 },
    study_time: {
      minutes: 160,
      previous_minutes: 125,
      change_minutes: 35,
      topics: [
        { id: 3, title: 'Spanish', minutes: 95 },
        { id: 8, title: 'Biology', minutes: 52 },
      ],
    },
    leaves: {
      total: 784,
      earned: 96,
      previous_earned: 84,
      change: 12,
      sources: {
        cards: { count: 41, leaves: 41 },
        questions: { count: 13, leaves: 26 },
        explanations: { count: 3, leaves: 30 },
      },
    },
    ...overrides,
  }
}

/** All time: nothing to compare with, so the comparisons are null. */
export function makeAllTimeInsights(overrides: Partial<PeriodInsights> = {}): PeriodInsights {
  const week = makePeriodInsights()

  return makePeriodInsights({
    period: 'all',
    from: '2026-02-09',
    recall_rate: { percentage: 79, previous_percentage: null, change_points: null },
    study_time: { ...week.study_time, previous_minutes: null, change_minutes: null },
    leaves: { ...week.leaves, earned: 784, previous_earned: null, change: null },
    ...overrides,
  })
}

/** A learner who hasn't practised: what the API answers for a new account. */
export function makeEmptyInsights(period: InsightsPeriod = 'week'): PeriodInsights {
  const none = { count: 0, leaves: 0 }

  return {
    period,
    from: period === 'all' ? null : '2026-10-30',
    to: '2026-11-05',
    streak: { current_days: 0, best_days: 0 },
    recall_rate: { percentage: null, previous_percentage: null, change_points: null },
    study_time: {
      minutes: 0,
      previous_minutes: period === 'all' ? null : 0,
      change_minutes: period === 'all' ? null : 0,
      topics: [],
    },
    leaves: {
      total: 0,
      earned: 0,
      previous_earned: period === 'all' ? null : 0,
      change: period === 'all' ? null : 0,
      sources: { cards: none, questions: none, explanations: none },
    },
  }
}

export function makeActivityDay(overrides: Partial<ActivityDay> = {}): ActivityDay {
  return {
    date: '2026-10-30',
    cards_reviewed: 9,
    questions_answered: 1,
    leaves: 11,
    minutes: 23,
    ...overrides,
  }
}

/** `GET /insights/activity` as in the API.md example. */
export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    from: '2025-11-04',
    to: '2026-11-03',
    days: [
      makeActivityDay(),
      makeActivityDay({
        date: '2026-11-01',
        cards_reviewed: 2,
        questions_answered: 2,
        leaves: 6,
        minutes: 0,
      }),
    ],
    summary: {
      active_days: 2,
      longest_streak_days: 1,
      average_minutes_per_active_day: 12,
      best_weekday: 'friday',
    },
    ...overrides,
  }
}

export function makeEmptyActivity(): Activity {
  return makeActivity({
    days: [],
    summary: {
      active_days: 0,
      longest_streak_days: 0,
      average_minutes_per_active_day: null,
      best_weekday: null,
    },
  })
}

/** `GET /insights/topics` for the four topics of `makeLibrary()`. */
export function makeTopicInsights(): TopicInsight[] {
  return [
    { id: 1, title: 'Biology', study_minutes: 276, card_count: 90 },
    { id: 2, title: 'Chemistry', study_minutes: 0, card_count: 58 },
    { id: 3, title: 'Computer science', study_minutes: 222, card_count: 82 },
    { id: 4, title: 'Spanish', study_minutes: 0, card_count: 0 },
  ]
}
