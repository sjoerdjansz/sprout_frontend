import type {
  Conversation,
  ConversationListItem,
  ConversationSummary,
} from '@/stores/conversations'

/** A conversation shaped like the API.md example: two messages and a half-agreed draft. */
export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 10,
    title: 'Biomechanics of running',
    topic: null,
    is_saved: false,
    draft: {
      title: 'Biomechanics of running',
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
        created_at: '2026-10-30T13:12:04.000000Z',
      },
      {
        id: 102,
        role: 'tutor',
        content: 'Great choice! What draws you to it: **sport** or **injuries**?',
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

/** A conversation as `GET /conversations?topic_id=` lists it: a count and its first messages. */
export function makeListItem(overrides: Partial<ConversationListItem> = {}): ConversationListItem {
  const { messages, ...summary } = makeConversation()

  return { ...summary, message_count: 7, preview: messages, ...overrides }
}
