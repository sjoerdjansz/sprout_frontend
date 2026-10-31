import type { User } from '@/stores/auth'
import type { Settings } from '@/stores/settings'

/** A signed-in learner, shaped like `GET /user` in `../API.md`. */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    pending_email: null,
    email_verified_at: '2026-10-29T12:00:00.000000Z',
    avatar_color: 'sun',
    interests: ['science'],
    wants_daily_reminder: true,
    created_at: '2026-10-29T12:00:00.000000Z',
    ...overrides,
  }
}

/** Preferences shaped like `GET /settings` in `../API.md`, with its example values. */
export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    learner_role: null,
    avatar_color: 'sun',
    ai_level: 'medium',
    daily_goal_cards: 20,
    session_size: 20,
    interleave_subtopics: true,
    hint_before_answer: true,
    save_chats_as_material: true,
    wants_daily_reminder: true,
    reminder_time: '19:00',
    wants_streak_reminder: false,
    wants_weekly_insights: false,
    reminder_channel: 'email',
    theme: 'system',
    reduce_motion: false,
    sound_effects: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...overrides,
  }
}
