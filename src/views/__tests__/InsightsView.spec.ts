import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import {
  makeActivity,
  makeAllTimeInsights,
  makeEmptyActivity,
  makeEmptyInsights,
  makePeriodInsights,
  makeTopicInsights,
} from '@/__tests__/insightsFixtures'
import { makeSettings, makeUser } from '@/__tests__/settingsFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeLibrary, makeSubtopic, makeTopic } from '@/__tests__/topicFixtures'
import { useAuthStore } from '@/stores/auth'
import type { Topic } from '@/stores/topics'
import InsightsView from '../InsightsView.vue'

const holding = { percent: 90, holding: true }

// makeLibrary() plus a mastered topic and one you haven't started.
function library(): Topic[] {
  return [
    ...makeLibrary(),
    makeTopic({
      id: 5,
      title: 'Geography',
      subtopics: [
        makeSubtopic({
          id: 501,
          topic_id: 5,
          mastery: 95,
          facets: { cards: holding, explain: holding, quiz: holding },
        }),
      ],
    }),
    makeTopic({ id: 6, title: 'History', subtopics: [] }),
  ]
}

function topicInsights(): ReturnType<typeof makeTopicInsights> {
  return [
    ...makeTopicInsights(),
    { id: 5, title: 'Geography', study_minutes: 40, card_count: 12 },
    { id: 6, title: 'History', study_minutes: 0, card_count: 0 },
  ]
}

type Routes = Parameters<typeof stubApi>[0]

function stubInsights(overrides: Routes = {}): ReturnType<typeof stubApi> {
  return stubApi({
    'GET /user': Response.json(makeUser()),
    'GET /conversations': Response.json([]),
    'GET /settings': Response.json(makeSettings()),
    'GET /topics': () => Response.json(library()),
    'GET /insights?period=week': () => Response.json(makePeriodInsights()),
    'GET /insights/activity': () => Response.json(makeActivity()),
    'GET /insights/topics': () => Response.json(topicInsights()),
    ...overrides,
  })
}

function failing(message: string): () => Response {
  return () => Response.json({ message }, { status: 500 })
}

function calls(fetchMock: ReturnType<typeof stubApi>, path: string): number {
  return fetchMock.mock.calls.filter(([input]) => String(input).endsWith(path)).length
}

async function mountInsights(): Promise<VueWrapper> {
  const wrapper = mount(InsightsView, { global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

describe('InsightsView', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
    await router.push('/insights')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows this week’s numbers and every part of the page', async () => {
    stubInsights()

    const wrapper = await mountInsights()

    expect(wrapper.get('h1').text()).toBe('Insights')
    expect(wrapper.get('[data-test="tab-week"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="tile-streak"]').text()).toContain('Best so far: 14 days')
    expect(wrapper.get('[data-test="tile-recall"]').text()).toContain('+3 pts vs last week')
    expect(wrapper.get('[data-test="tile-study-time"]').text()).toContain('2h 40m')
    expect(wrapper.get('[data-test="leaves-total"]').text()).toBe('784')
    expect(wrapper.get('[data-test="leaves-earned"]').text()).toContain('+96 this week')
    expect(wrapper.get('[data-test="leaves-explanations"]').text()).toContain(
      '3 explanations checked',
    )
    expect(wrapper.get('[data-test="leaves-explanations"]').text()).toContain('+30')
    expect(wrapper.findAll('[data-test="activity-day"]')).toHaveLength(2)
    expect(wrapper.get('[data-test="activity-summary"]').text()).toContain(
      'Friday is your best day',
    )
    expect(wrapper.find('[data-test="insights-welcome"]').exists()).toBe(false)
    expect(wrapper.findAll('main h2').map((heading) => heading.text())).toEqual([
      'Leaves',
      '2 practice days in the last year',
      'Where your time goes',
      'Mastery by facet',
    ])
  })

  it('loads the period of the tab you pick, once', async () => {
    const fetchMock = stubInsights({
      'GET /insights?period=all': () => Response.json(makeAllTimeInsights()),
    })
    const wrapper = await mountInsights()

    await wrapper.get('[data-test="tab-all"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="tile-recall"]').text()).toContain(
      'Since you started in February',
    )
    expect(wrapper.get('[data-test="leaves-earned"]').text()).toContain('+784 all time')

    await wrapper.get('[data-test="tab-week"]').trigger('click')
    await wrapper.get('[data-test="tab-all"]').trigger('click')
    await flushPromises()

    expect(calls(fetchMock, '/insights?period=week')).toBe(1)
    expect(calls(fetchMock, '/insights?period=all')).toBe(1)
    // The heatmap and the topic chart don't change with the tabs.
    expect(calls(fetchMock, '/insights/activity')).toBe(1)
    expect(calls(fetchMock, '/insights/topics')).toBe(1)
  })

  it('keeps the rest of the page when one part fails, and tries that part again', async () => {
    const fetchMock = stubInsights({
      'GET /insights/activity': [
        failing('Something went wrong on our side. Try again in a moment.'),
        () => Response.json(makeActivity()),
      ],
    })
    const wrapper = await mountInsights()

    expect(wrapper.get('[data-test="activity-error"]').text()).toContain(
      'Something went wrong on our side. Try again in a moment.',
    )
    expect(wrapper.find('[data-test="tile-streak"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="leaves-total"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="topic-bubble"]').length).toBeGreaterThan(0)

    await wrapper.get('[data-test="activity-retry"]').trigger('click')
    await flushPromises()

    expect(calls(fetchMock, '/insights/activity')).toBe(2)
    expect(wrapper.find('[data-test="activity-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="activity-day"]')).toHaveLength(2)
  })

  it('keeps the heatmap and the charts when the tiles fail', async () => {
    stubInsights({ 'GET /insights?period=week': failing('Something went wrong on our side.') })

    const wrapper = await mountInsights()

    expect(wrapper.get('[data-test="period-error"]').text()).toContain(
      'Something went wrong on our side.',
    )
    expect(wrapper.find('[data-test="leaves-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="tile-mastered"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="activity-day"]')).toHaveLength(2)
    expect(wrapper.find('[data-test="facet-cards"]').exists()).toBe(true)
  })

  it('shows the library’s parts failing on their own, and the tiles still', async () => {
    stubInsights({ 'GET /topics': failing('Something went wrong on our side.') })

    const wrapper = await mountInsights()

    expect(wrapper.find('[data-test="mastered-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="topics-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="facets-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="tile-streak"]').exists()).toBe(true)
  })

  it('invites a new learner to practise instead of showing empty charts', async () => {
    stubInsights({
      'GET /topics': Response.json([]),
      'GET /insights?period=week': Response.json(makeEmptyInsights()),
      'GET /insights/activity': Response.json(makeEmptyActivity()),
      'GET /insights/topics': Response.json([]),
    })

    const wrapper = await mountInsights()

    expect(wrapper.get('[data-test="insights-welcome"]').text()).toContain(
      'Your insights grow as you practise',
    )
    expect(wrapper.get('[data-test="insights-welcome-link"]').attributes('href')).toBe('/topics')
    expect(wrapper.get('[data-test="tile-recall"]').text()).toContain('—')
    expect(wrapper.get('[data-test="tile-recall"]').text()).not.toContain('0%')
    expect(wrapper.get('[data-test="tile-mastered"]').text()).toContain('Add a topic to start')
    expect(wrapper.get('[data-test="leaves-total"]').text()).toBe('0')
    expect(wrapper.findAll('[data-test="activity-day"]')).toHaveLength(0)
    expect(wrapper.find('[data-test="activity-summary"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="activity-selected"]').text()).toBe(
      'Your practice days will show up here.',
    )
    expect(wrapper.get('[data-test="topics-empty"]').text()).toContain('No topics yet')
    expect(wrapper.find('[data-test="topic-bubble"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="facets-empty"]').exists()).toBe(true)
  })

  it('counts topics mastered from the library with the dashboard’s rule', async () => {
    stubInsights()

    const wrapper = await mountInsights()

    const tile = wrapper.get('[data-test="tile-mastered"]').text()
    expect(tile).toContain('1')
    expect(tile).toContain('of 6')
    expect(tile).toContain('Computer science is next in line')
  })

  it('counts per facet how many subtopics hold, and names the bottleneck', async () => {
    stubInsights()

    const wrapper = await mountInsights()

    expect(wrapper.get('[data-test="facet-cards"]').text()).toContain('7 of 9 holding')
    expect(wrapper.get('[data-test="facet-explain"]').text()).toContain('3 of 9 holding')
    expect(wrapper.get('[data-test="facet-quiz"]').text()).toContain('2 of 9 holding')
    const bottleneck = wrapper.get('[data-test="facets-bottleneck"]')
    expect(bottleneck.text()).toContain('Quiz is your bottleneck.')
    expect(bottleneck.text()).toContain('1 subtopic would be mastered if it held there too.')
    expect(bottleneck.get('a').attributes('href')).toBe('/practice?modes=retrieval')
  })

  it('plots topics by time and mastery, and names the ones not started', async () => {
    stubInsights()

    const wrapper = await mountInsights()

    const bubbles = wrapper.findAll('[data-test="topic-bubble"]')
    expect(bubbles.map((bubble) => bubble.attributes('aria-label'))).toEqual([
      'Biology: 4h 36m, 61% mastery, 90 cards',
      'Chemistry: 0 min, 23% mastery, 58 cards',
      'Computer science: 3h 42m, 78% mastery, 82 cards',
      'Spanish: 0 min, 30% mastery, 0 cards',
      'Geography: 40 min, 95% mastery, 12 cards',
    ])
    expect(wrapper.get('[data-test="topics-not-started"]').text()).toBe(
      'Not practised yet: History',
    )
    // The most studied topic is picked first.
    expect(wrapper.get('[data-test="topic-detail"]').text()).toContain('Biology')

    await bubbles[2]?.trigger('click')

    const detail = wrapper.get('[data-test="topic-detail"]')
    expect(detail.text()).toContain('Computer science')
    expect(detail.text()).toContain('Big-O notation')
    expect(detail.get('a').attributes('href')).toBe('/topics/3')
  })

  it('shows a day’s numbers when you pick it in the heatmap', async () => {
    stubInsights()
    const wrapper = await mountInsights()

    // Your latest practice day shows first.
    expect(wrapper.get('[data-test="activity-selected"]').text()).toContain('Sun 1 Nov 2026')

    await wrapper.findAll('[data-test="activity-day"]')[0]?.trigger('click')

    expect(wrapper.get('[data-test="activity-selected"]').text()).toBe(
      'Fri 30 Oct 2026 · 9 cards · 1 question · 11 leaves · 23 min',
    )
  })
})
