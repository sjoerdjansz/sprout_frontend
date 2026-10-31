import type {
  Category,
  FacetProgress,
  Subtopic,
  SubtopicDetail,
  SubtopicSource,
  Topic,
} from '@/stores/topics'

/** YYYY-MM-DD a number of days from today on this device, as the API sends review dates. */
export function dateFromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

type FacetValue = [percent: number | null, holding: boolean]

function facets(cards: FacetValue, explain: FacetValue, quiz: FacetValue): Subtopic['facets'] {
  const progress = ([percent, holding]: FacetValue): FacetProgress => ({ percent, holding })

  return { cards: progress(cards), explain: progress(explain), quiz: progress(quiz) }
}

/** A subtopic shaped like the API.md example: practised, growing, nothing due. */
export function makeSubtopic(overrides: Partial<Subtopic> = {}): Subtopic {
  return {
    id: 101,
    topic_id: 1,
    title: 'Photosynthesis',
    description: 'How plants turn light, water and carbon dioxide into sugar and oxygen.',
    notes: 'Plants use chlorophyll to capture light.',
    source_count: 1,
    generation_status: 'ready',
    mastery: 64,
    due_cards: 0,
    next_review_on: dateFromToday(4),
    is_new: false,
    slipping: false,
    facets: facets([86, true], [58, false], [72, false]),
    ...overrides,
  }
}

export function makeCategories(): Category[] {
  return [
    { id: 1, name: 'Science' },
    { id: 2, name: 'Technology' },
    { id: 3, name: 'Maths' },
    { id: 4, name: 'Languages' },
    { id: 5, name: 'History' },
    { id: 6, name: 'Arts & culture' },
  ]
}

export function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: 1,
    title: 'Biology',
    description: 'How living things work, from cells to whole ecosystems.',
    notes: null,
    category: { id: 1, name: 'Science' },
    goal: { description: null, deadline: null, recall_percentage: null },
    subtopics: [],
    created_at: '2026-10-16T19:01:22.000000Z',
    ...overrides,
  }
}

/**
 * A small library: four topics in three categories, with a slipping subtopic, due cards, a
 * mastered subtopic and one you haven't started.
 */
export function makeLibrary(): Topic[] {
  return [
    makeTopic({
      subtopics: [
        makeSubtopic({ due_cards: 3, next_review_on: dateFromToday(0) }),
        makeSubtopic({
          id: 102,
          title: 'Cell respiration',
          mastery: 38,
          due_cards: 6,
          next_review_on: dateFromToday(0),
          slipping: true,
          facets: facets([61, false], [null, false], [55, false]),
        }),
        makeSubtopic({
          id: 103,
          title: 'Chlorophyll',
          mastery: 82,
          facets: facets([90, true], [86, true], [84, false]),
        }),
      ],
    }),
    makeTopic({
      id: 2,
      title: 'Chemistry',
      description: 'Atoms, bonds and the reactions between them.',
      subtopics: [
        makeSubtopic({ id: 201, topic_id: 2, title: 'The periodic table', mastery: 45 }),
        makeSubtopic({
          id: 202,
          topic_id: 2,
          title: 'Chemical bonds',
          mastery: 0,
          next_review_on: null,
          is_new: true,
          facets: facets([null, false], [null, false], [null, false]),
        }),
      ],
    }),
    makeTopic({
      id: 3,
      title: 'Computer science',
      category: { id: 2, name: 'Technology' },
      subtopics: [
        makeSubtopic({
          id: 301,
          topic_id: 3,
          title: 'Big-O notation',
          mastery: 92,
          facets: facets([95, true], [88, true], [90, true]),
        }),
        makeSubtopic({
          id: 302,
          topic_id: 3,
          title: 'Recursion',
          due_cards: 2,
          next_review_on: dateFromToday(0),
        }),
      ],
    }),
    makeTopic({
      id: 4,
      title: 'Spanish',
      category: { id: 4, name: 'Languages' },
      subtopics: [makeSubtopic({ id: 401, topic_id: 4, title: 'Food & drinks', mastery: 30 })],
    }),
  ]
}

/** A source shaped like the API.md example; your own notes unless you say otherwise. */
export function makeSource(overrides: Partial<SubtopicSource> = {}): SubtopicSource {
  return {
    id: 51,
    type: 'own',
    content: 'Plants use chlorophyll to capture light.',
    material: null,
    updated_at: '2026-10-31T22:06:24.000000Z',
    ...overrides,
  }
}

/** The subtopic page's subtopic: Photosynthesis with its topic, counts and your notes as its source. */
export function makeSubtopicDetail(overrides: Partial<SubtopicDetail> = {}): SubtopicDetail {
  return {
    ...makeSubtopic({ due_cards: 1, next_review_on: dateFromToday(0) }),
    topic: { id: 1, title: 'Biology', category: { id: 1, name: 'Science' } },
    counts: { flashcards: 2, questions: 2, sessions: 1 },
    sources: [makeSource()],
    ...overrides,
  }
}
