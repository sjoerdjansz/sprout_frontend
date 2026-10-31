import { dateFromToday } from '@/__tests__/topicFixtures'
import type { Flashcard } from '@/stores/flashcards'
import type { Question } from '@/stores/questions'

/** A card shaped like the API.md example: reviewed, rated good, due in a few days. */
export function makeFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: 41,
    subtopic_id: 101,
    front: 'Where in the cell does photosynthesis happen?',
    back: 'In the chloroplasts.',
    origin: 'ai',
    paused: false,
    is_due: false,
    due_on: dateFromToday(2),
    last_rating: 'good',
    last_reviewed_at: '2026-10-24T08:45:00.000000Z',
    recall: 92,
    created_at: '2026-10-20T19:04:30.000000Z',
    ...overrides,
  }
}

/** A multiple choice question you answered correctly. */
export function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 17,
    subtopic_id: 101,
    type: 'multiple_choice',
    prompt: 'Which light does chlorophyll absorb least?',
    origin: 'ai',
    options: [
      { id: 60, label: 'Red', is_correct: false, explanation: null },
      { id: 61, label: 'Green', is_correct: true, explanation: 'Green is reflected.' },
    ],
    latest_answer: {
      response: null,
      option_id: 61,
      score: 100,
      verdict: 'correct',
      feedback: 'Exactly. Green is reflected, so we see leaves as green.',
      answered_at: '2026-10-29T08:40:00.000000Z',
    },
    created_at: '2026-10-20T19:04:30.000000Z',
    ...overrides,
  }
}

/** An open question you got half right. */
export function makeOpenQuestion(overrides: Partial<Question> = {}): Question {
  return makeQuestion({
    id: 18,
    type: 'open',
    prompt: 'Why do plants need sunlight to make food?',
    options: [],
    latest_answer: {
      response: 'Because sunlight gives them energy.',
      option_id: null,
      score: 60,
      verdict: 'almost',
      feedback: 'Light as the energy source: right. You’re missing carbon dioxide.',
      answered_at: '2026-10-29T08:40:00.000000Z',
    },
    ...overrides,
  })
}
