import { describe, expect, it } from 'vitest'
import { isTopicMastered, masteredTopicCount, retentionQueue, reviewMinutes } from '@/lib/dashboard'
import { makeSubtopic, makeTopic } from '@/__tests__/topicFixtures'
import type { Subtopic } from '@/stores/topics'

const holding = { percent: 90, holding: true }

function masteredSubtopic(overrides: Partial<Subtopic> = {}): Subtopic {
  return makeSubtopic({
    mastery: 92,
    facets: { cards: holding, explain: holding, quiz: holding },
    ...overrides,
  })
}

describe('isTopicMastered', () => {
  it('needs every subtopic mastered', () => {
    expect(isTopicMastered(makeTopic({ subtopics: [masteredSubtopic()] }))).toBe(true)
    expect(
      isTopicMastered(makeTopic({ subtopics: [masteredSubtopic(), makeSubtopic({ id: 102 })] })),
    ).toBe(false)
  })

  it('never counts a topic without subtopics', () => {
    expect(isTopicMastered(makeTopic({ subtopics: [] }))).toBe(false)
  })
})

describe('masteredTopicCount', () => {
  it('counts the mastered topics', () => {
    const topics = [
      makeTopic({ id: 1, subtopics: [masteredSubtopic()] }),
      makeTopic({ id: 2, subtopics: [makeSubtopic()] }),
    ]

    expect(masteredTopicCount(topics)).toBe(1)
  })
})

describe('retentionQueue', () => {
  it('lists topics with cards due or a slipping subtopic, slipping first, then most due', () => {
    const topics = [
      makeTopic({ id: 1, title: 'Nothing due', subtopics: [makeSubtopic()] }),
      makeTopic({ id: 2, title: 'Few due', subtopics: [makeSubtopic({ due_cards: 3 })] }),
      makeTopic({ id: 3, title: 'Many due', subtopics: [makeSubtopic({ due_cards: 9 })] }),
      makeTopic({
        id: 4,
        title: 'Slipping',
        subtopics: [makeSubtopic({ due_cards: 1, slipping: true, mastery: 40 })],
      }),
    ]

    const queue = retentionQueue(topics)

    expect(queue.map((item) => item.title)).toEqual(['Slipping', 'Many due', 'Few due'])
    expect(queue[0]).toMatchObject({ topicId: 4, cardCount: 1, mastery: 40, slipping: true })
  })

  it('adds up the due cards and averages the mastery of the whole topic', () => {
    const topic = makeTopic({
      subtopics: [
        makeSubtopic({ id: 101, due_cards: 2, mastery: 50 }),
        makeSubtopic({ id: 102, due_cards: 4, mastery: 70 }),
      ],
    })

    expect(retentionQueue([topic])[0]).toMatchObject({ cardCount: 6, mastery: 60 })
  })
})

describe('reviewMinutes', () => {
  it('rounds the practice setup’s time per card up to whole minutes', () => {
    expect(reviewMinutes(26)).toBe(11)
    expect(reviewMinutes(1)).toBe(1)
    expect(reviewMinutes(0)).toBe(0)
  })
})
