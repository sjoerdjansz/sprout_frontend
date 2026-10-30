/*
 * Example library from the knowledge map design, until the API serves your real topics.
 * A function, so every store (and every test) starts from a fresh copy.
 */
import type { Category, FacetProgress, Subtopic, Topic } from '@/stores/topics'

type FacetValue = [percent: number | null, holding: boolean]

function facets(cards: FacetValue, explain: FacetValue, quiz: FacetValue): Subtopic['facets'] {
  const progress = ([percent, holding]: FacetValue): FacetProgress => ({ percent, holding })

  return { cards: progress(cards), explain: progress(explain), quiz: progress(quiz) }
}

type DemoSubtopic = Omit<Subtopic, 'notes' | 'slipping' | 'isNew'> & { slipping?: boolean }

function subtopic(demo: DemoSubtopic): Subtopic {
  return { notes: '', isNew: false, ...demo, slipping: demo.slipping ?? false }
}

/** The starter categories every library begins with; you can add your own. */
export function demoCategories(): Category[] {
  return [
    { id: 1, name: 'Science' },
    { id: 2, name: 'Technology' },
    { id: 3, name: 'Maths' },
    { id: 4, name: 'Languages' },
    { id: 5, name: 'History' },
    { id: 6, name: 'Arts & culture' },
  ]
}

export function demoTopics(): Topic[] {
  return [
    {
      id: 1,
      title: 'Biology',
      categoryId: 1,
      icon: 'sprout',
      tint: 'mint',
      description: 'How living things work, from cells to whole ecosystems.',
      notes: '',
      subtopics: [
        subtopic({
          id: 101,
          title: 'Photosynthesis',
          mastery: 64,
          dueCards: 3,
          nextReview: 'today',
          description: 'How plants turn light, water and carbon dioxide into sugar and oxygen.',
          facets: facets([86, true], [58, false], [72, false]),
        }),
        subtopic({
          id: 102,
          title: 'Cell respiration',
          mastery: 38,
          dueCards: 6,
          nextReview: 'today',
          slipping: true,
          description: 'How cells release energy from glucose.',
          facets: facets([61, false], [null, false], [55, false]),
        }),
        subtopic({
          id: 103,
          title: 'Chlorophyll',
          mastery: 82,
          dueCards: 0,
          nextReview: 'in 4 days',
          description: 'The pigment that captures light, and why leaves are green.',
          facets: facets([90, true], [86, true], [84, false]),
        }),
        subtopic({
          id: 104,
          title: 'DNA replication',
          mastery: 47,
          dueCards: 2,
          nextReview: 'today',
          description: 'How a cell copies its DNA before it divides.',
          facets: facets([72, false], [null, false], [null, false]),
        }),
      ],
    },
    {
      id: 2,
      title: 'Chemistry',
      categoryId: 1,
      icon: 'zap',
      tint: 'sky',
      description: 'Atoms, bonds and the reactions between them.',
      notes: '',
      subtopics: [
        subtopic({
          id: 201,
          title: 'The periodic table',
          mastery: 71,
          dueCards: 0,
          nextReview: 'in 2 days',
          description: 'How elements are organised, and what the rows and columns tell you.',
          facets: facets([87, true], [66, false], [85, true]),
        }),
        subtopic({
          id: 202,
          title: 'Chemical bonds',
          mastery: 55,
          dueCards: 4,
          nextReview: 'today',
          description: 'Ionic, covalent and metallic bonds.',
          facets: facets([76, false], [null, false], [61, false]),
        }),
      ],
    },
    {
      id: 3,
      title: 'Computer science',
      categoryId: 2,
      icon: 'chart-no-axes-column',
      tint: 'peach',
      description: 'Algorithms, data structures and how to reason about code.',
      notes: '',
      subtopics: [
        subtopic({
          id: 301,
          title: 'Big-O notation',
          mastery: 94,
          dueCards: 0,
          nextReview: 'in 12 days',
          description: 'Describing how running time grows with input size.',
          facets: facets([96, true], [90, true], [92, true]),
        }),
        subtopic({
          id: 302,
          title: 'Recursion',
          mastery: 51,
          dueCards: 5,
          nextReview: 'today',
          description: 'Functions that call themselves, base cases and the call stack.',
          facets: facets([74, false], [40, false], [null, false]),
        }),
        subtopic({
          id: 303,
          title: 'Sorting algorithms',
          mastery: 70,
          dueCards: 0,
          nextReview: 'in 3 days',
          description: 'Bubble, merge and quick sort, and when to use which.',
          facets: facets([85, true], [62, false], [78, false]),
        }),
        subtopic({
          id: 304,
          title: 'Hash tables',
          mastery: 66,
          dueCards: 0,
          nextReview: 'in 5 days',
          description: 'Fast lookups with keys, hashing and collisions.',
          facets: facets([86, true], [null, false], [70, false]),
        }),
      ],
    },
    {
      id: 4,
      title: 'Spanish',
      categoryId: 4,
      icon: 'message-circle',
      tint: 'sun',
      description: 'Everyday Spanish for travelling and conversation.',
      notes: '',
      subtopics: [
        subtopic({
          id: 401,
          title: 'Present-tense verbs',
          mastery: 28,
          dueCards: 12,
          nextReview: 'today',
          slipping: true,
          description: 'Regular and the most common irregular verbs in the present tense.',
          facets: facets([55, false], [null, false], [48, false]),
        }),
        subtopic({
          id: 402,
          title: 'Food & drinks',
          mastery: 88,
          dueCards: 0,
          nextReview: 'in 9 days',
          description: 'Ordering in a restaurant and shopping at the market.',
          facets: facets([93, true], [86, true], [90, true]),
        }),
        subtopic({
          id: 403,
          title: 'Numbers & time',
          mastery: 76,
          dueCards: 0,
          nextReview: 'in 6 days',
          description: 'Counting, prices and telling the time.',
          facets: facets([88, true], [70, false], [86, true]),
        }),
      ],
    },
  ]
}
