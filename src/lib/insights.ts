/*
 * The Insights page's rules (see `../specs/insights.md`): what each tile says, how the plant grows,
 * how the heatmap is laid out and shaded, which topics go in the bubble chart and which facet is
 * the bottleneck. Kept apart from the components so they stay presentational and easy to test.
 */
import type { TabItem } from '@/components/BaseTabs.vue'
import { isTopicMastered } from '@/lib/dashboard'
import type { PracticeModeId } from '@/lib/practiceModes'
import { averageMastery, facets, isMastered, pluralize, type Facet } from '@/lib/topics'
import type {
  Activity,
  ActivityDay,
  InsightsPeriod,
  PeriodInsights,
  TopicInsight,
  Weekday,
} from '@/stores/insights'
import type { FacetKey, Subtopic, Topic } from '@/stores/topics'

export const periodTabs: TabItem<InsightsPeriod>[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
]

// This month is the last 30 days, not the calendar month, so it isn't compared with "October".
const comparedWith: Record<Exclude<InsightsPeriod, 'all'>, string> = {
  week: 'last week',
  month: 'the 30 days before',
}

/** How the leaves card names the period: "+96 this week". */
export const periodPhrase: Record<InsightsPeriod, string> = {
  week: 'this week',
  month: 'in the last 30 days',
  all: 'all time',
}

/** "0 min", "35 min", "2h 05m", "3h" */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, '0')}m`
}

// A real minus sign, so "−4" doesn't read as a dash.
function signed(value: number, format: (absolute: number) => string = String): string {
  return `${value < 0 ? '−' : '+'}${format(Math.abs(value))}`
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const weekdayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function shortMonth(date: Date): string {
  return (monthNames[date.getUTCMonth()] ?? '').slice(0, 3)
}

// API dates are days in your timezone; reading them as UTC midnight keeps them on that day.
function parseDay(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** "Since you started in October" (with the year when it isn't this one); null before any practice. */
export function sinceLabel(from: string | null, to: string): string | null {
  if (from === null) {
    return null
  }
  const start = parseDay(from)
  const sameYear = start.getUTCFullYear() === parseDay(to).getUTCFullYear()
  const month = monthNames[start.getUTCMonth()] ?? ''

  return `Since you started in ${sameYear ? month : `${month} ${start.getUTCFullYear()}`}`
}

export interface TileText {
  value: string
  unit?: string
  hint?: string
}

export function streakTile(insights: PeriodInsights): TileText {
  const { current_days: current, best_days: best } = insights.streak

  return {
    value: String(current),
    unit: current === 1 ? 'day' : 'days',
    hint: best === 0 ? 'Practise today to start one' : `Best so far: ${pluralize(best, 'day')}`,
  }
}

export function recallTile(insights: PeriodInsights): TileText {
  const { percentage, change_points: change } = insights.recall_rate

  // Nothing to count isn't 0%: say what makes it appear instead.
  if (percentage === null) {
    return { value: '—', hint: 'Rate a card or answer a quiz question to see it' }
  }
  if (insights.period === 'all') {
    return { value: `${percentage}%`, hint: sinceLabel(insights.from, insights.to) ?? undefined }
  }

  const before = comparedWith[insights.period]
  if (change === null) {
    return { value: `${percentage}%`, hint: `Nothing to compare with ${before}` }
  }

  return {
    value: `${percentage}%`,
    hint: change === 0 ? `Same as ${before}` : `${signed(change)} pts vs ${before}`,
  }
}

export function studyTimeTile(insights: PeriodInsights): TileText {
  const { minutes, change_minutes: change, topics } = insights.study_time
  const value = formatStudyTime(minutes)

  if (insights.period === 'all' || change === null) {
    return {
      value,
      hint: topics.length > 0 ? `Across ${pluralize(topics.length, 'topic')}` : undefined,
    }
  }

  const before = comparedWith[insights.period]

  return {
    value,
    hint: change === 0 ? `Same as ${before}` : `${signed(change, formatStudyTime)} vs ${before}`,
  }
}

/** "+12 vs last week" next to the leaves earned; null for all time. */
export function leavesChangeText(period: InsightsPeriod, change: number | null): string | null {
  if (period === 'all' || change === null) {
    return null
  }
  const before = comparedWith[period]

  return change === 0 ? `same as ${before}` : `${signed(change)} vs ${before}`
}

/** The topic closest to mastered: the highest average mastery among the ones that aren't yet. */
export function nextTopicToMaster(topics: Topic[]): Topic | null {
  const candidates = topics.filter((topic) => topic.subtopics.length > 0 && !isTopicMastered(topic))

  return candidates.reduce<Topic | null>(
    (best, topic) => (best === null || averageMastery(topic) > averageMastery(best) ? topic : best),
    null,
  )
}

/** "N of M" topics mastered, with the dashboard's rule for mastered. */
export function masteredTile(topics: Topic[]): TileText {
  const mastered = topics.filter(isTopicMastered).length
  const next = nextTopicToMaster(topics)
  let hint: string | undefined
  if (topics.length === 0) {
    hint = 'Add a topic to start'
  } else if (next !== null) {
    hint = `${next.title} is next in line`
  } else if (mastered === topics.length) {
    hint = 'Every topic is mastered'
  }

  return { value: String(mastered), unit: `of ${topics.length}`, hint }
}

// --- The plant on the leaves card

export interface PlantStage {
  name: 'Seed' | 'Sprout' | 'Plant' | 'Tree'
  /** Leaves ever earned from which the plant is at this stage. */
  from: number
}

/*
 * A regular day (20 cards, 5 questions, one explanation) earns about 40 leaves: a sprout after a
 * few days, a plant after about two weeks and a tree after a couple of months of practice.
 */
export const plantStages: PlantStage[] = [
  { name: 'Seed', from: 0 },
  { name: 'Sprout', from: 100 },
  { name: 'Plant', from: 500 },
  { name: 'Tree', from: 2000 },
]

export interface PlantGrowth {
  /** 0 (seed) to 3 (tree). */
  stageIndex: number
  stage: PlantStage
  /** Null once it's a tree. */
  next: PlantStage | null
  /** Leaves earned since this stage began, and how many this stage spans. */
  progress: number
  span: number
}

export function plantGrowth(totalLeaves: number): PlantGrowth {
  let stageIndex = 0
  plantStages.forEach((stage, index) => {
    if (totalLeaves >= stage.from) {
      stageIndex = index
    }
  })
  const stage = plantStages[stageIndex] ?? { name: 'Seed', from: 0 }
  const next = plantStages[stageIndex + 1] ?? null

  return {
    stageIndex,
    stage,
    next,
    progress: next === null ? 1 : totalLeaves - stage.from,
    span: next === null ? 1 : next.from - stage.from,
  }
}

// --- The activity heatmap

/** 0 = no practice; 1–4 = a quarter of your busiest day's leaves each. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapCell {
  date: string
  /** Null on a day without practice. */
  day: ActivityDay | null
  level: HeatLevel
  /** "Thu 5 Nov 2026: 11 cards, 2 questions, 27 leaves, 5 min" */
  label: string
}

/** One column, Monday at the top. A null cell lies outside the year shown. */
export interface HeatmapWeek {
  cells: (HeatmapCell | null)[]
}

export interface HeatmapMonth {
  label: string
  /** The column (week) in which the month starts. */
  column: number
}

export interface Heatmap {
  weeks: HeatmapWeek[]
  months: HeatmapMonth[]
}

/*
 * Shaded against your own busiest day, not fixed numbers: a fixed scale would be all pale for
 * someone who does ten cards a day and all dark for someone who does a hundred.
 */
export function heatLevel(leaves: number, busiestDayLeaves: number): HeatLevel {
  if (leaves <= 0 || busiestDayLeaves <= 0) {
    return 0
  }

  return Math.min(4, Math.max(1, Math.ceil((leaves / busiestDayLeaves) * 4))) as HeatLevel
}

/** "11 cards · 2 questions · 27 leaves · 5 min"; screen readers get commas with `separator`. */
export function dayDetail(day: ActivityDay, separator = ' | '): string {
  return [
    pluralize(day.cards_reviewed, 'card'),
    pluralize(day.questions_answered, 'question'),
    pluralize(day.leaves, 'leaf', 'leaves'),
    formatStudyTime(day.minutes),
  ].join(separator)
}

/** "Thu 5 Nov 2026" */
export function dayName(date: string): string {
  const day = parseDay(date)

  return `${weekdayShortNames[day.getUTCDay()]} ${day.getUTCDate()} ${shortMonth(day)} ${day.getUTCFullYear()}`
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

export function heatmap(activity: Activity): Heatmap {
  const daysByDate = new Map(activity.days.map((day) => [day.date, day]))
  const busiest = Math.max(0, ...activity.days.map((day) => day.leaves))
  const first = parseDay(activity.from)
  const last = parseDay(activity.to)
  // Columns start on a Monday, so the first one can begin before the year shown.
  const mondayOffset = (first.getUTCDay() + 6) % 7
  const start = new Date(first.getTime() - mondayOffset * dayInMilliseconds)

  const weeks: HeatmapWeek[] = []
  const months: HeatmapMonth[] = []
  for (let monday = start; monday <= last; ) {
    const cells: (HeatmapCell | null)[] = []
    for (let weekday = 0; weekday < 7; weekday++) {
      const current = new Date(monday.getTime() + weekday * dayInMilliseconds)
      if (current < first || current > last) {
        cells.push(null)
        continue
      }
      const date = formatDay(current)
      const day = daysByDate.get(date) ?? null
      if (current.getUTCDate() === 1) {
        months.push({ label: shortMonth(current), column: weeks.length })
      }
      cells.push({
        date,
        day,
        level: day === null ? 0 : heatLevel(day.leaves, busiest),
        label: `${dayName(date)}: ${day === null ? 'no practice' : dayDetail(day, ', ')}`,
      })
    }
    weeks.push({ cells })
    monday = new Date(monday.getTime() + 7 * dayInMilliseconds)
  }

  return { weeks, months }
}

/** "Nov 2025 – Nov 2026" */
export function activityRange(activity: Activity): string {
  const from = parseDay(activity.from)
  const to = parseDay(activity.to)

  return `${shortMonth(from)} ${from.getUTCFullYear()} – ${shortMonth(to)} ${to.getUTCFullYear()}`
}

/** "Monday" */
export function weekdayName(weekday: Weekday): string {
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

// --- Where your time goes

export interface TopicBubble {
  id: number
  title: string
  minutes: number
  cardCount: number
  /** The topic's average mastery, 0–100, from `GET /topics`. */
  mastery: number
  topic: Topic
}

export interface TopicBubbles {
  /** The topics with study time or mastery: they have a place on the chart. */
  plotted: TopicBubble[]
  /** No study time and no mastery yet: all of them would sit on top of each other at 0, 0. */
  notStarted: TopicBubble[]
}

/** Joins `GET /insights/topics` with `GET /topics` on id; a topic missing from either is left out. */
export function topicBubbles(insights: TopicInsight[], topics: Topic[]): TopicBubbles {
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]))
  const bubbles: TopicBubble[] = []
  for (const insight of insights) {
    const topic = topicsById.get(insight.id)
    if (topic === undefined) {
      continue
    }
    bubbles.push({
      id: insight.id,
      title: topic.title,
      minutes: insight.study_minutes,
      cardCount: insight.card_count,
      mastery: averageMastery(topic),
      topic,
    })
  }

  return {
    plotted: bubbles.filter((bubble) => bubble.minutes > 0 || bubble.mastery > 0),
    notStarted: bubbles.filter((bubble) => bubble.minutes === 0 && bubble.mastery === 0),
  }
}

/** The right end of the time axis: at least an hour, else rounded up to whole hours. */
export function minutesAxisMax(minutes: number[]): number {
  const most = Math.max(0, ...minutes)

  return Math.max(60, Math.ceil(most / 60) * 60)
}

/** Grows with the square root of the cards, so area (not width) follows the count. */
export function bubbleRadius(cardCount: number): number {
  return Math.min(36, 10 + Math.sqrt(cardCount) * 1.8)
}

// --- Mastery by facet

export interface FacetRow {
  facet: Facet
  /** Subtopics where this facet holds over time. */
  holding: number
}

export interface Bottleneck {
  facet: Facet
  /** Subtopics that would be mastered if this facet held too. */
  wouldMaster: number
}

export interface FacetSummary {
  subtopicCount: number
  rows: FacetRow[]
  /** Null without practice, or when every facet holds on as many subtopics. */
  bottleneck: Bottleneck | null
}

// Mastered needs every facet to hold, so it's the facet holding on the fewest subtopics that keeps
// the most of them back. A tie goes to the first in the facet order.
function findBottleneck(rows: FacetRow[], subtopics: Subtopic[]): Bottleneck | null {
  const counts = rows.map((row) => row.holding)
  if (
    !subtopics.some((subtopic) => !subtopic.is_new) ||
    Math.min(...counts) === Math.max(...counts)
  ) {
    return null
  }
  const weakest = rows.reduce((lowest, row) => (row.holding < lowest.holding ? row : lowest))
  const others = facets.filter((facet) => facet.key !== weakest.facet.key)
  const wouldMaster = subtopics.filter(
    (subtopic) =>
      !isMastered(subtopic) &&
      !subtopic.is_new &&
      !subtopic.slipping &&
      !subtopic.facets[weakest.facet.key].holding &&
      others.every((facet) => subtopic.facets[facet.key].holding),
  ).length

  return { facet: weakest.facet, wouldMaster }
}

export function facetSummary(topics: Topic[]): FacetSummary {
  const subtopics = topics.flatMap((topic) => topic.subtopics)
  const rows = facets.map((facet) => ({
    facet,
    holding: subtopics.filter((subtopic) => subtopic.facets[facet.key].holding).length,
  }))

  return { subtopicCount: subtopics.length, rows, bottleneck: findBottleneck(rows, subtopics) }
}

/** The practice mode that trains each facet, for the bottleneck's button. */
export const facetPracticeMode: Record<FacetKey, PracticeModeId> = {
  cards: 'cards',
  explain: 'feynman',
  quiz: 'retrieval',
}
