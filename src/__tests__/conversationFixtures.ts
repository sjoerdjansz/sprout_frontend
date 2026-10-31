import type { Conversation, ConversationSummary } from '@/stores/conversations'
import type { Material } from '@/stores/materials'

/** A conversation shaped like the API.md example: two messages and a half-agreed draft. */
export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 10,
    title: 'Biomechanics of running',
    topic: null,
    is_saved: false,
    draft: {
      title: 'Biomechanics of running',
      category: 'Science',
      goal: {
        description: 'Explain the phases of the running gait to the runners I coach.',
        deadline: null,
        recall_percentage: null,
      },
      subtopics: [{ title: 'Gait cycle', content: 'A running stride has a stance phase.' }],
    },
    started_at: '2026-10-30T13:12:04.000000Z',
    last_activity_at: '2026-10-30T15:12:04.000000Z',
    messages: [
      {
        id: 101,
        role: 'user',
        content: 'I want to learn more about biomechanics.',
        materials: [],
        created_at: '2026-10-30T13:12:04.000000Z',
      },
      {
        id: 102,
        role: 'tutor',
        content: 'Great choice! What draws you to it: **sport** or **injuries**?',
        materials: [],
        created_at: '2026-10-30T13:13:04.000000Z',
      },
    ],
    ...overrides,
  }
}

/** The same conversation as `GET /conversations` lists it, without messages. */
export function makeSummary(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  const { messages: _messages, ...summary } = makeConversation()

  return { ...summary, ...overrides }
}

/** A file attached in the chat, shaped like the API.md material object. */
export function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 7,
    original_filename: 'Lecture 1.pdf',
    size_bytes: 482113,
    status: 'ready',
    error: null,
    created_at: '2026-10-30T13:11:40.000000Z',
    ...overrides,
  }
}
