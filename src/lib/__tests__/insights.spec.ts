import { describe, expect, it } from 'vitest'
import {
  makeActivity,
  makeActivityDay,
  makeAllTimeInsights,
  makeEmptyInsights,
  makePeriodInsights,
  makeTopicInsights,
} from '@/__tests__/insightsFixtures'
import { makeLibrary, makeSubtopic, makeTopic } from '@/__tests__/topicFixtures'
import {
  bubbleRadius,
  dayName,
  facetSummary,
  formatStudyTime,
  heatLevel,
  heatmap,
  leavesChangeText,
  masteredTile,
  minutesAxisMax,
  plantGrowth,
  recallTile,
  sinceLabel,
  streakTile,
  studyTimeTile,
  topicBubbles,
} from '@/lib/insights'
import type { Subtopic } from '@/stores/topics'

const holding = { percent: 90, holding: true }
const notHolding = { percent: 60, holding: false }

function masteredSubtopic(overrides: Partial<Subtopic> = {}): Subtopic {
  return makeSubtopic({
    mastery: 92,
    facets: { cards: holding, explain: holding, quiz: holding },
    ...overrides,
  })
}

describe('formatStudyTime', () => {
  it('shows minutes under an hour, hours and minutes above', () => {
    expect(formatStudyTime(0)).toBe('0 min')
    expect(formatStudyTime(35)).toBe('35 min')
    expect(formatStudyTime(160)).toBe('2h 40m')
    expect(formatStudyTime(65)).toBe('1h 05m')
    expect(formatStudyTime(180)).toBe('3h')
  })
})

describe('the period tiles', () => {
  it('shows the streak with your best', () => {
    expect(streakTile(makePeriodInsights())).toEqual({
      value: '6',
      unit: 'days',
      hint: 'Best so far: 14 days',
    })
  })

  it('compares recall with last week in points, or the 30 days before for a month', () => {
    expect(recallTile(makePeriodInsights()).hint).toBe('+3 pts vs last week')
    expect(
      recallTile(
        makePeriodInsights({
          period: 'month',
          recall_rate: { percentage: 81, previous_percentage: 85, change_points: -4 },
        }),
      ),
    ).toEqual({ value: '81%', hint: '−4 pts vs the 30 days before' })
  })

  it('shows no recall rate instead of 0% when there was nothing to count', () => {
    const tile = recallTile(makeEmptyInsights())

    expect(tile.value).toBe('—')
    expect(tile.hint).toBe('Rate a card or answer a quiz question to see it')
  })

  it('says when there’s nothing to compare recall with', () => {
    const insights = makePeriodInsights({
      recall_rate: { percentage: 80, previous_percentage: null, change_points: null },
    })

    expect(recallTile(insights).hint).toBe('Nothing to compare with last week')
  })

  it('says since when for all time, without a comparison', () => {
    expect(recallTile(makeAllTimeInsights())).toEqual({
      value: '79%',
      hint: 'Since you started in February',
    })
  })

  it('shows study time with its change, which can be negative', () => {
    expect(studyTimeTile(makePeriodInsights())).toEqual({
      value: '2h 40m',
      hint: '+35 min vs last week',
    })
    const less = makePeriodInsights({
      study_time: { minutes: 40, previous_minutes: 105, change_minutes: -65, topics: [] },
    })
    expect(studyTimeTile(less).hint).toBe('−1h 05m vs last week')
    expect(studyTimeTile(makeEmptyInsights()).hint).toBe('Same as last week')
  })

  it('counts the topics for all time study time', () => {
    expect(studyTimeTile(makeAllTimeInsights()).hint).toBe('Across 2 topics')
    expect(studyTimeTile(makeEmptyInsights('all')).hint).toBeUndefined()
  })

  it('counts mastered topics with the dashboard’s rule and names the next in line', () => {
    const topics = [
      makeTopic({ id: 1, title: 'Biology', subtopics: [masteredSubtopic()] }),
      makeTopic({ id: 2, title: 'Chemistry', subtopics: [makeSubtopic({ mastery: 40 })] }),
      makeTopic({ id: 3, title: 'Recursion', subtopics: [makeSubtopic({ mastery: 70 })] }),
      makeTopic({ id: 4, title: 'Empty', subtopics: [] }),
    ]

    expect(masteredTile(topics)).toEqual({
      value: '1',
      unit: 'of 4',
      hint: 'Recursion is next in line',
    })
  })

  it('says when every topic is mastered, or that there are none yet', () => {
    expect(masteredTile([makeTopic({ subtopics: [masteredSubtopic()] })]).hint).toBe(
      'Every topic is mastered',
    )
    expect(masteredTile([])).toEqual({ value: '0', unit: 'of 0', hint: 'Add a topic to start' })
  })
})

describe('sinceLabel', () => {
  it('names the month you started, with its year when it isn’t this one', () => {
    expect(sinceLabel('2026-02-09', '2026-11-03')).toBe('Since you started in February')
    expect(sinceLabel('2025-12-30', '2026-11-03')).toBe('Since you started in December 2025')
    expect(sinceLabel(null, '2026-11-03')).toBeNull()
  })
})

describe('leaves', () => {
  it('grows the plant at 100, 500 and 2000 leaves', () => {
    expect(plantGrowth(0)).toMatchObject({ stageIndex: 0, progress: 0, span: 100 })
    expect(plantGrowth(99).stage.name).toBe('Seed')
    expect(plantGrowth(100).stage.name).toBe('Sprout')
    expect(plantGrowth(784)).toMatchObject({ stageIndex: 2, progress: 284, span: 1500 })
    expect(plantGrowth(2000)).toMatchObject({ stageIndex: 3, next: null })
  })

  it('compares the leaves earned, but not for all time', () => {
    expect(leavesChangeText('week', 12)).toBe('+12 vs last week')
    expect(leavesChangeText('month', -5)).toBe('−5 vs the 30 days before')
    expect(leavesChangeText('week', 0)).toBe('same as last week')
    expect(leavesChangeText('all', null)).toBeNull()
  })
})

describe('the heatmap', () => {
  it('shades a day against your busiest day', () => {
    expect(heatLevel(0, 80)).toBe(0)
    expect(heatLevel(1, 80)).toBe(1)
    expect(heatLevel(40, 80)).toBe(2)
    expect(heatLevel(45, 80)).toBe(3)
    expect(heatLevel(80, 80)).toBe(4)
  })

  it('lays out the year in weeks from Monday, with empty cells outside it', () => {
    // 2025-11-04 is a Tuesday, 2026-11-03 also.
    const { weeks } = heatmap(makeActivity({ days: [] }))

    expect(weeks).toHaveLength(53)
    expect(weeks[0]?.cells[0]).toBeNull()
    expect(weeks[0]?.cells[1]?.date).toBe('2025-11-04')
    expect(weeks[52]?.cells[1]?.date).toBe('2026-11-03')
    expect(weeks[52]?.cells[2]).toBeNull()
    const days = weeks.flatMap((week) => week.cells).filter((cell) => cell !== null)
    expect(days).toHaveLength(365)
  })

  it('labels practice days with their numbers and the rest as no practice', () => {
    const { weeks } = heatmap(makeActivity())
    const cells = weeks.flatMap((week) => week.cells)

    const practised = cells.find((cell) => cell?.date === '2026-10-30')
    expect(practised?.level).toBe(4)
    expect(practised?.label).toBe('Fri 30 Oct 2026: 9 cards, 1 question, 11 leaves, 23 min')
    const smaller = cells.find((cell) => cell?.date === '2026-11-01')
    expect(smaller?.level).toBe(3)
    expect(cells.find((cell) => cell?.date === '2026-10-31')?.label).toBe(
      'Sat 31 Oct 2026: no practice',
    )
  })

  it('names each month over the week it starts in', () => {
    const { months } = heatmap(makeActivity())

    expect(months.map((month) => month.label)).toEqual([
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
    ])
    expect(months[0]?.column).toBe(4)
  })

  it('writes a day out in full', () => {
    expect(dayName(makeActivityDay().date)).toBe('Fri 30 Oct 2026')
  })
})

describe('topicBubbles', () => {
  it('joins the time per topic with its mastery from the library', () => {
    const { plotted } = topicBubbles(makeTopicInsights(), makeLibrary())

    const biology = plotted.find((bubble) => bubble.id === 1)
    expect(biology).toMatchObject({ title: 'Biology', minutes: 276, cardCount: 90, mastery: 61 })
  })

  it('lists topics without time or mastery apart, instead of piling them up at 0, 0', () => {
    const topics = [...makeLibrary(), makeTopic({ id: 5, title: 'History', subtopics: [] })]
    const insights = [
      ...makeTopicInsights(),
      { id: 5, title: 'History', study_minutes: 0, card_count: 0 },
    ]

    const { plotted, notStarted } = topicBubbles(insights, topics)

    expect(notStarted.map((bubble) => bubble.title)).toEqual(['History'])
    expect(plotted.map((bubble) => bubble.id)).toEqual([1, 2, 3, 4])
  })

  it('leaves out a topic that’s missing from either list', () => {
    const { plotted, notStarted } = topicBubbles(makeTopicInsights(), [makeLibrary()[0]!])

    expect([...plotted, ...notStarted].map((bubble) => bubble.id)).toEqual([1])
  })

  it('keeps the time axis at least an hour long', () => {
    expect(minutesAxisMax([0, 0])).toBe(60)
    expect(minutesAxisMax([276, 30])).toBe(300)
  })

  it('sizes a bubble by its cards, within bounds', () => {
    expect(bubbleRadius(0)).toBe(10)
    expect(bubbleRadius(100)).toBe(28)
    expect(bubbleRadius(10_000)).toBe(36)
  })
})

describe('facetSummary', () => {
  it('counts per facet how many subtopics hold', () => {
    const summary = facetSummary(makeLibrary())

    expect(summary.subtopicCount).toBe(8)
    expect(summary.rows.map((row) => [row.facet.label, row.holding])).toEqual([
      ['Flashcards', 6],
      ['Explain it', 2],
      ['Quiz', 1],
    ])
  })

  it('names the facet holding on the fewest subtopics as the bottleneck', () => {
    const almost = makeSubtopic({
      id: 7,
      facets: { cards: holding, explain: notHolding, quiz: holding },
    })
    const topics = [makeTopic({ subtopics: [masteredSubtopic(), almost] })]

    expect(facetSummary(topics).bottleneck).toEqual({
      facet: expect.objectContaining({ key: 'explain' }),
      wouldMaster: 1,
    })
  })

  it('has no bottleneck before any practice, or when every facet holds as often', () => {
    const fresh = makeSubtopic({
      is_new: true,
      facets: { cards: notHolding, explain: notHolding, quiz: notHolding },
    })
    expect(facetSummary([makeTopic({ subtopics: [fresh] })]).bottleneck).toBeNull()
    expect(facetSummary([makeTopic({ subtopics: [masteredSubtopic()] })]).bottleneck).toBeNull()
    expect(facetSummary([]).subtopicCount).toBe(0)
  })
})
