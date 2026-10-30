import { describe, expect, it } from 'vitest'
import { makeListItem } from '@/__tests__/conversationFixtures'
import { makeFlashcard, makeOpenQuestion, makeQuestion } from '@/__tests__/materialFixtures'
import { dateFromToday } from '@/__tests__/topicFixtures'
import {
  answerText,
  filterFlashcards,
  filterQuestions,
  filterSessions,
  flashcardStatus,
  lastReview,
  sessionMinutes,
  sessionSnippet,
  wordCount,
} from '../subtopicPage'

const due = makeFlashcard({ id: 1, front: 'Chlorophyll colour', is_due: true, recall: 52 })
const fresh = makeFlashcard({ id: 2, front: 'New card', last_rating: null, recall: null })
const paused = makeFlashcard({ id: 3, front: 'Autumn leaves', paused: true })
const strong = makeFlashcard({ id: 4, back: 'In the CHLOROPLASTS.', recall: 95 })

describe('subtopic page rules', () => {
  it('filters cards on due, weak and paused', () => {
    const cards = [due, fresh, paused, strong]
    const ids = (filter: Parameters<typeof filterFlashcards>[2]): number[] =>
      filterFlashcards(cards, '', filter).map((card) => card.id)

    expect(ids('all')).toEqual([1, 2, 3, 4])
    expect(ids('due')).toEqual([1])
    // A card you never reviewed has no recall, so it isn't weak.
    expect(ids('weak')).toEqual([1])
    expect(ids('paused')).toEqual([3])
  })

  it('searches the front and back of a card, ignoring case', () => {
    expect(filterFlashcards([due, strong], 'chloro', 'all').map((card) => card.id)).toEqual([1, 4])
    expect(filterFlashcards([due, strong], 'autumn', 'all')).toEqual([])
  })

  it("describes a card's status and last review", () => {
    expect(flashcardStatus(paused)).toMatchObject({ label: 'Paused', tone: 'neutral' })
    expect(flashcardStatus(due)).toMatchObject({ label: 'Due today', tone: 'sun' })
    expect(flashcardStatus(makeFlashcard({ due_on: dateFromToday(1) })).label).toBe('Due tomorrow')
    expect(flashcardStatus(makeFlashcard({ due_on: dateFromToday(4) })).label).toBe('Due in 4 days')
    expect(lastReview(strong)).toBe('Last: Good · 95% recall')
    expect(lastReview(fresh)).toBeNull()
  })

  it('names your answer: the option you picked or what you typed', () => {
    expect(answerText(makeQuestion())).toBe('Green')
    expect(answerText(makeOpenQuestion())).toBe('Because sunlight gives them energy.')
    expect(answerText(makeQuestion({ latest_answer: null }))).toBeNull()
  })

  it('filters questions by type, wrong answers and search', () => {
    const wrong = makeOpenQuestion({
      id: 19,
      type: 'feynman',
      latest_answer: { ...makeOpenQuestion().latest_answer!, verdict: 'not_quite' },
    })
    const questions = [makeQuestion(), makeOpenQuestion(), wrong]
    const ids = (query: string, filter: Parameters<typeof filterQuestions>[2]): number[] =>
      filterQuestions(questions, query, filter).map((question) => question.id)

    expect(ids('', 'multiple_choice')).toEqual([17])
    expect(ids('', 'feynman')).toEqual([19])
    // Almost was half right, so only Not quite counts as wrong.
    expect(ids('', 'wrong')).toEqual([19])
    expect(ids('green', 'all')).toEqual([17])
    expect(ids('sunlight gives', 'all')).toEqual([18, 19])
  })

  it('finds sessions by title or by what was said', () => {
    const running = makeListItem()
    const leaves = makeListItem({ id: 12, title: 'Why leaves are green' })

    expect(filterSessions([running, leaves], 'LEAVES').map((session) => session.id)).toEqual([12])
    expect(filterSessions([running, leaves], 'injuries')).toHaveLength(2)
  })

  it('sums up a session in minutes and one line', () => {
    const session = makeListItem({
      started_at: '2026-10-30T13:00:00.000000Z',
      last_activity_at: '2026-10-30T13:14:20.000000Z',
    })

    expect(sessionMinutes(session)).toBe(14)
    expect(sessionSnippet(session)).toBe('Great choice! What draws you to it: sport or injuries?')
  })

  it('counts the words in your notes', () => {
    expect(wordCount('  Plants use\nlight.  ')).toBe(3)
  })
})
