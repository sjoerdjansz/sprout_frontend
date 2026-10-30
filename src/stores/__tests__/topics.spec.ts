import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTopicsStore, type Topic } from '@/stores/topics'

function topicNamed(topics: Topic[], title: string): Topic {
  const topic = topics.find((candidate) => candidate.title === title)
  if (topic === undefined) {
    throw new Error(`No topic ${title}`)
  }

  return topic
}

describe('topics store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with the example library', () => {
    expect(useTopicsStore().topics.map((topic) => topic.title)).toEqual([
      'Biology',
      'Chemistry',
      'Computer science',
      'Spanish',
    ])
  })

  it('adds a topic with a new id and no subtopics, and edits it', () => {
    const store = useTopicsStore()

    const id = store.addTopic({
      title: 'Astronomy',
      description: 'Stars and planets.',
      notes: '',
      categoryId: 1,
    })
    store.updateTopic(id, {
      title: 'Astronomy basics',
      description: 'Stars, planets and galaxies.',
      notes: 'NASA site',
      categoryId: 1,
    })

    const astronomy = topicNamed(store.topics, 'Astronomy basics')
    expect(astronomy).toMatchObject({ id, subtopics: [], notes: 'NASA site', icon: 'book-open' })
    expect(store.topics.filter((topic) => topic.id === id)).toHaveLength(1)
  })

  it('starts with the starter categories and adds your own once', () => {
    const store = useTopicsStore()

    expect(store.categories.map((category) => category.name)).toEqual([
      'Science',
      'Technology',
      'Maths',
      'Languages',
      'History',
      'Arts & culture',
    ])

    const music = store.addCategory('Music')
    expect(store.categoryName(music)).toBe('Music')
    expect(store.addCategory(' music ')).toBe(music)
    expect(store.addCategory('maths')).toBe(3)
    expect(store.categories).toHaveLength(7)
  })

  it('adds a subtopic you have not started yet', () => {
    const store = useTopicsStore()
    const chemistry = topicNamed(store.topics, 'Chemistry')

    const id = store.addSubtopic({
      title: 'Acids and bases',
      description: '',
      notes: '',
      topicId: chemistry.id,
    })

    expect(topicNamed(store.topics, 'Chemistry').subtopics.slice(-1)[0]).toMatchObject({
      id,
      title: 'Acids and bases',
      mastery: 0,
      isNew: true,
      nextReview: null,
    })
  })

  it('moves a subtopic to another topic when you change its main topic', () => {
    const store = useTopicsStore()
    const biology = topicNamed(store.topics, 'Biology')
    const chemistry = topicNamed(store.topics, 'Chemistry')
    const chlorophyll = biology.subtopics.find((subtopic) => subtopic.title === 'Chlorophyll')

    store.updateSubtopic(chlorophyll?.id ?? 0, {
      title: 'Chlorophyll molecules',
      description: 'The pigment.',
      notes: '',
      topicId: chemistry.id,
    })

    expect(topicNamed(store.topics, 'Biology').subtopics.map((s) => s.title)).not.toContain(
      'Chlorophyll',
    )
    expect(topicNamed(store.topics, 'Chemistry').subtopics.slice(-1)[0]).toMatchObject({
      title: 'Chlorophyll molecules',
      mastery: 82,
    })
  })
})
