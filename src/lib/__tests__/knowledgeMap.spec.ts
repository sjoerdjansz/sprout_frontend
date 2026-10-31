import { describe, expect, it } from 'vitest'
import {
  filterTopics,
  librarySummary,
  noFilters,
  subtopicCaption,
  subtopicLevel,
  topicAppearance,
  usedCategories,
  visibleSubtopics,
} from '@/lib/knowledgeMap'
import { makeCategories, makeLibrary, makeTopic } from '@/__tests__/topicFixtures'
import type { Subtopic, Topic } from '@/stores/topics'

function topicNamed(title: string): Topic {
  const topic = makeLibrary().find((candidate) => candidate.title === title)
  if (topic === undefined) {
    throw new Error(`No topic ${title}`)
  }

  return topic
}

function subtopicNamed(title: string): Subtopic {
  const subtopic = makeLibrary()
    .flatMap((topic) => topic.subtopics)
    .find((candidate) => candidate.title === title)
  if (subtopic === undefined) {
    throw new Error(`No subtopic ${title}`)
  }

  return subtopic
}

describe('knowledge map rules', () => {
  it('only calls a subtopic mastered when all three facets hold', () => {
    expect(subtopicLevel(subtopicNamed('Big-O notation')).label).toBe('Mastered')
    expect(subtopicLevel(subtopicNamed('Chlorophyll')).label).toBe('Growing')
    expect(subtopicLevel(subtopicNamed('Food & drinks')).label).toBe('Seedling')
    expect(subtopicLevel(subtopicNamed('Cell respiration')).label).toBe('Slipping')
    expect(subtopicLevel(subtopicNamed('Chemical bonds')).label).toBe('New')
  })

  it('captions each subtopic with its most urgent fact', () => {
    expect(subtopicCaption(subtopicNamed('Cell respiration'))).toEqual({
      text: 'Slipping · 6 cards due',
      tone: 'sun',
    })
    expect(subtopicCaption(subtopicNamed('Photosynthesis')).text).toBe('3 cards due today')
    expect(subtopicCaption(subtopicNamed('Big-O notation')).text).toBe('Mastered')
    expect(subtopicCaption(subtopicNamed('Chlorophyll')).text).toBe('Next review in 4 days')
    expect(subtopicCaption(subtopicNamed('Chemical bonds')).text).toBe('Not started yet')
    expect(subtopicCaption({ ...subtopicNamed('Chemical bonds'), due_cards: 3 })).toEqual({
      text: 'Not started yet · 3 cards due',
      tone: 'sun',
    })
  })

  it('finds a topic by its own name or one of its subtopics', () => {
    const topics = makeLibrary()

    expect(filterTopics(topics, { ...noFilters, query: 'chem' }).map((t) => t.title)).toEqual([
      'Chemistry',
    ])
    expect(filterTopics(topics, { ...noFilters, query: 'RECURSION' }).map((t) => t.title)).toEqual([
      'Computer science',
    ])
  })

  it('shows only the matching subtopics, or all of them when the topic name matches', () => {
    const biology = topicNamed('Biology')

    expect(
      visibleSubtopics(biology, { ...noFilters, query: 'chloro' }).map((s) => s.title),
    ).toEqual(['Chlorophyll'])
    expect(visibleSubtopics(biology, { ...noFilters, query: 'bio' })).toHaveLength(3)
  })

  it('filters by category and by what needs attention', () => {
    const topics = makeLibrary()

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
    expect(usedCategories(makeCategories(), makeLibrary()).map((c) => c.name)).toEqual([
      'Science',
      'Technology',
      'Languages',
    ])
  })

  it('sums up the library', () => {
    expect(librarySummary(makeLibrary())).toBe(
      '4 topics · 8 subtopics · 1 mastered · 11 cards due today',
    )
  })

  it('gives a topic an icon for its category and a tint that rotates by id', () => {
    expect(topicAppearance(makeTopic({ id: 1 }))).toEqual({ icon: 'sprout', tint: 'sun' })
    expect(topicAppearance(makeTopic({ id: 4, category: { id: 9, name: 'Music' } }))).toEqual({
      icon: 'book-open',
      tint: 'mint',
    })
  })

  it('captions a subtopic whose cards are being made, or could not be made, before anything else', () => {
    const slipping = subtopicNamed('Cell respiration')

    expect(subtopicCaption({ ...slipping, generation_status: 'generating' })).toEqual({
      text: 'Sprout is making your cards…',
      tone: 'sky',
    })
    expect(subtopicCaption({ ...slipping, generation_status: 'failed' })).toEqual({
      text: "Sprout couldn't make its cards. Try again on its page.",
      tone: 'ember',
    })
  })
})
