import type { PracticeSession, PracticeSessionDone } from '@/stores/practice'

/** Nothing practised yet. */
export function makeDone(overrides: Partial<PracticeSessionDone> = {}): PracticeSessionDone {
  return {
    flashcard_reviews: [],
    answers: [],
    explanations: [],
    messages: [],
    message_count: 0,
    ...overrides,
  }
}

/** A session on Photosynthesis (101) of Biology (1), shaped like the API.md example. */
export function makePracticeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 52,
    topic: { id: 1, title: 'Biology' },
    subtopic: { id: 101, title: 'Photosynthesis' },
    plan: { modes: ['cards'], card_ids: [41], question_ids: [], explain_subtopic_id: null },
    started_at: '2026-10-31T09:00:00.000000Z',
    ended_at: null,
    last_activity_at: '2026-10-31T09:06:00.000000Z',
    is_finished: false,
    done: makeDone(),
    xp_earned: 0,
    streak_days: 3,
    subtopics: [],
    ...overrides,
  }
}
