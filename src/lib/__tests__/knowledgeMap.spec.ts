import { describe, expect, it } from 'vitest'
import {
  filterTopics,
  librarySummary,
  noFilters,
  subtopicCaption,
  subtopicLevel,
  suggestPractice,
  topicLevel,
  usedCategories,
  visibleSubtopics,
} from '@/lib/knowledgeMap'
import { demoCategories, demoTopics } from '@/stores/topicsDemoData'
import type { Subtopic, Topic } from '@/stores/topics'

function topicNamed(title: string): Topic {
  const topic = demoTopics().find((candidate) => candidate.title === title)
  if (topic === undefined) {
    throw new Error(`No demo topic ${title}`)
  }

  return topic
}

function subtopicNamed(title: string): Subtopic {
  const subtopic = demoTopics()
    .flatMap((topic) => topic.subtopics)
    .find((candidate) => candidate.title === title)
  if (subtopic === undefined) {
    throw new Error(`No demo subtopic ${title}`)
  }

  return subtopic
}

describe('knowledge map rules', () => {
  it('only calls a subtopic mastered when all three facets hold', () => {
    expect(subtopicLevel(subtopicNamed('Big-O notation')).label).toBe('Mastered')
    expect(subtopicLevel(subtopicNamed('Chlorophyll')).label).toBe('Growing')
    expect(subtopicLevel(subtopicNamed('DNA replication')).label).toBe('Seedling')
    expect(subtopicLevel(subtopicNamed('Cell respiration')).label).toBe('Slipping')
  })

  it('rates a whole topic by its subtopics', () => {
    expect(topicLevel(topicNamed('Biology')).label).toBe('Slipping')
    expect(topicLevel(topicNamed('Computer science')).label).toBe('Growing')
    expect(topicLevel({ ...topicNamed('Chemistry'), subtopics: [] }).label).toBe('New')
  })

  it('captions each subtopic with its most urgent fact', () => {
    expect(subtopicCaption(subtopicNamed('Cell respiration'))).toEqual({
      text: 'Slipping · 6 cards due',
      tone: 'sun',
    })
    expect(subtopicCaption(subtopicNamed('Photosynthesis')).text).toBe('3 cards due today')
    expect(subtopicCaption(subtopicNamed('Big-O notation')).text).toBe('Mastered')
    expect(subtopicCaption(subtopicNamed('Chlorophyll')).text).toBe('Next review in 4 days')
  })

  it('finds a topic by its own name or one of its subtopics', () => {
    const topics = demoTopics()

    expect(filterTopics(topics, { ...noFilters, query: 'chem' }).map((t) => t.title)).toEqual([
      'Chemistry',
    ])
    expect(filterTopics(topics, { ...noFilters, query: 'RECURSION' }).map((t) => t.title)).toEqual([
      'Computer science',
    ])
  })

  it('shows only the matching subtopics, or all of them when the topic name matches', () => {
    const biology = topicNamed('Biology')

    expect(visibleSubtopics(biology, { ...noFilters, query: 'dna' }).map((s) => s.title)).toEqual([
      'DNA replication',
    ])
    expect(visibleSubtopics(biology, { ...noFilters, query: 'bio' })).toHaveLength(4)
  })

  it('filters by category and by what needs attention', () => {
    const topics = demoTopics()

    expect(filterTopics(topics, { ...noFilters, categoryId: 4 }).map((t) => t.title)).toEqual([
      'Spanish',
    ])
    expect(
      visibleSubtopics(topicNamed('Computer science'), { ...noFilters, needsAttention: true }).map(
        (s) => s.title,
      ),
    ).toEqual(['Recursion'])
  })

  it('offers a filter only for the categories your topics use', () => {
    expect(usedCategories(demoCategories(), demoTopics()).map((c) => c.name)).toEqual([
      'Science',
      'Technology',
      'Languages',
    ])
  })

  it('sums up the library', () => {
    expect(librarySummary(demoTopics())).toBe(
      '4 topics · 13 subtopics · 2 mastered · 32 cards due today',
    )
  })

  it('suggests the weakest facet, untried facets first', () => {
    const biology = topicNamed('Biology')
    const photosynthesis = subtopicNamed('Photosynthesis')
    const cellRespiration = subtopicNamed('Cell respiration')

    expect(suggestPractice(biology, photosynthesis)).toMatchObject({
      mode: { id: 'feynman' },
      reason: 'your weakest facet.',
    })
    expect(suggestPractice(biology, cellRespiration)).toMatchObject({
      mode: { id: 'feynman' },
      reason: 'you haven’t tried this facet yet.',
    })
    expect(suggestPractice(biology, subtopicNamed('Big-O notation')).mode.id).toBe('open')
  })

  it('suggests reviewing what is due across a whole topic', () => {
    expect(suggestPractice(topicNamed('Biology'), null)).toMatchObject({
      mode: { id: 'cards' },
      reason: '11 cards are due across Biology.',
    })
    const noneDue = {
      ...topicNamed('Spanish'),
      subtopics: [subtopicNamed('Food & drinks')],
    }
    expect(suggestPractice(noneDue, null).mode.id).toBe('open')
  })
})
