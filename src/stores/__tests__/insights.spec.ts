import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  makeActivity,
  makeAllTimeInsights,
  makeEmptyActivity,
  makePeriodInsights,
  makeTopicInsights,
} from '@/__tests__/insightsFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { useInsightsStore } from '../insights'

const unreachable = "Can't reach Sprout right now. Check your connection and try again."

function failing(status: number, message: string): () => Response {
  return () => Response.json({ message }, { status })
}

describe('insights store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads a period’s tiles and leaves', async () => {
    const fetchMock = stubApi({ 'GET /insights?period=week': Response.json(makePeriodInsights()) })
    const store = useInsightsStore()

    await store.fetchPeriod('week')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.periods.week?.leaves.total).toBe(784)
    expect(store.periodStates.week).toEqual({ loading: false, error: null })
  })

  it('keeps each period, so switching back doesn’t load it again', async () => {
    const fetchMock = stubApi({
      'GET /insights?period=week': Response.json(makePeriodInsights()),
      'GET /insights?period=all': Response.json(makeAllTimeInsights()),
    })
    const store = useInsightsStore()

    await store.fetchPeriod('week')
    await store.fetchPeriod('all')
    await store.fetchPeriod('week')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(store.periods.all?.period).toBe('all')
  })

  it('asks once when a period is asked for twice at the same time', async () => {
    const fetchMock = stubApi({ 'GET /insights?period=month': Response.json(makePeriodInsights()) })
    const store = useInsightsStore()

    await Promise.all([store.fetchPeriod('month'), store.fetchPeriod('month')])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('loads a period again after forgetting them', async () => {
    const fetchMock = stubApi({ 'GET /insights?period=week': Response.json(makePeriodInsights()) })
    const store = useInsightsStore()

    await store.fetchPeriod('week')
    store.forgetPeriods()
    await store.fetchPeriod('week')

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps the nulls of all time as they are', async () => {
    stubApi({
      'GET /insights?period=all': Response.json(
        makeAllTimeInsights({
          from: null,
          recall_rate: { percentage: null, previous_percentage: null, change_points: null },
        }),
      ),
    })
    const store = useInsightsStore()

    await store.fetchPeriod('all')

    expect(store.periods.all?.from).toBeNull()
    expect(store.periods.all?.recall_rate.percentage).toBeNull()
    expect(store.periods.all?.study_time.change_minutes).toBeNull()
    expect(store.periods.all?.leaves.change).toBeNull()
  })

  it('keeps a period’s error and tries again on the next ask', async () => {
    const fetchMock = stubApi({
      'GET /insights?period=week': [
        failing(500, 'Something went wrong on our side. Try again in a moment.'),
        () => Response.json(makePeriodInsights()),
      ],
    })
    const store = useInsightsStore()

    await store.fetchPeriod('week')

    expect(store.periods.week).toBeUndefined()
    expect(store.periodStates.week.error).toBe(
      'Something went wrong on our side. Try again in a moment.',
    )

    await store.fetchPeriod('week')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(store.periodStates.week.error).toBeNull()
    expect(store.periods.week?.streak.current_days).toBe(6)
  })

  it('loads the activity heatmap, with null averages before any practice', async () => {
    stubApi({ 'GET /insights/activity': Response.json(makeEmptyActivity()) })
    const store = useInsightsStore()

    await store.fetchActivity()

    expect(store.activity?.days).toEqual([])
    expect(store.activity?.summary.average_minutes_per_active_day).toBeNull()
    expect(store.activity?.summary.best_weekday).toBeNull()
    expect(store.activityState).toEqual({ loading: false, error: null })
  })

  it('loads the time and cards per topic', async () => {
    stubApi({ 'GET /insights/topics': Response.json(makeTopicInsights()) })
    const store = useInsightsStore()

    await store.fetchTopicInsights()

    expect(store.topicInsights?.map((topic) => topic.study_minutes)).toEqual([276, 0, 222, 0])
  })

  it('lets each part fail on its own', async () => {
    stubApi({
      'GET /insights?period=week': Response.json(makePeriodInsights()),
      'GET /insights/activity': failing(500, 'Something went wrong on our side.'),
      'GET /insights/topics': Response.json(makeTopicInsights()),
    })
    const store = useInsightsStore()

    await Promise.all([
      store.fetchPeriod('week'),
      store.fetchActivity(),
      store.fetchTopicInsights(),
    ])

    expect(store.activityState.error).toBe('Something went wrong on our side.')
    expect(store.activity).toBeNull()
    expect(store.periodStates.week.error).toBeNull()
    expect(store.periods.week).toBeDefined()
    expect(store.topicInsightsState.error).toBeNull()
    expect(store.topicInsights).toHaveLength(4)
  })

  it('says so when Sprout can’t be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
    )
    const store = useInsightsStore()

    await store.fetchTopicInsights()

    expect(store.topicInsightsState.error).toBe(unreachable)
  })

  it('shows it’s loading until the answer is in', async () => {
    stubApi({ 'GET /insights/activity': Response.json(makeActivity()) })
    const store = useInsightsStore()

    const pending = store.fetchActivity()
    expect(store.activityState.loading).toBe(true)
    await pending

    expect(store.activityState.loading).toBe(false)
  })
})
