import { describe, expect, it } from 'vitest'
import { makeFlashcard, makeOpenQuestion, makeQuestion } from '@/__tests__/materialFixtures'
import { makeDone, makePracticeSession } from '@/__tests__/practiceFixtures'
import { dateFromToday } from '@/__tests__/topicFixtures'
import {
  answerText,
  filterFlashcards,
  filterQuestions,
  filterSessions,
  flashcardStatus,
  lastReview,
  sessionActivity,
  sessionTitle,
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
    expect(lastReview(strong)).toBe('Last: Solid · 95% recall')
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

  it('names a practice session and sums up what you did in it', () => {
    const cards = makePracticeSession({
      done: makeDone({
        flashcard_reviews: [
          { flashcard_id: 41, rating: 'again', reviewed_at: '' },
          { flashcard_id: 41, rating: 'good', reviewed_at: '' },
        ],
        answers: [
          { question_id: 17, option_id: 60, score: null, verdict: 'not_quite', answered_at: '' },
        ],
      }),
    })
    const mixed = makePracticeSession({
      plan: {
        modes: ['retrieval', 'open'],
        card_ids: [],
        question_ids: [],
        explain_subtopic_id: null,
      },
    })

    expect(sessionTitle(cards)).toBe('Flashcards')
    expect(sessionTitle(mixed)).toBe('Mixed session')
    // A card rated twice is one card; a wrong first pick without its second try isn't answered.
    expect(sessionActivity(cards)).toBe('1 card')
    expect(sessionActivity(mixed)).toBe('Nothing practised yet')
  })

  it('finds sessions by how you practised or by what was said', () => {
    const cards = makePracticeSession()
    const chat = makePracticeSession({
      id: 53,
      plan: { modes: ['open'], card_ids: [], question_ids: [], explain_subtopic_id: null },
      done: makeDone({
        messages: [
          {
            id: 1,
            role: 'tutor',
            content: 'Why are leaves green?',
            technique: null,
            created_at: '',
          },
        ],
      }),
    })

    expect(filterSessions([cards, chat], 'LEAVES').map((session) => session.id)).toEqual([53])
    expect(filterSessions([cards, chat], 'flashcards').map((session) => session.id)).toEqual([52])
  })

  it('counts the words in your notes', () => {
    expect(wordCount('  Plants use\nlight.  ')).toBe(3)
  })
})
