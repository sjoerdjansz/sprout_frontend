import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

/** One message in a conversation. Tutor messages are Markdown. */
export interface Message {
  id: number
  role: 'user' | 'tutor'
  content: string
  created_at: string
}

/** The learning goal; each part is null until the tutor and you agreed on it. */
export interface Goal {
  description: string | null
  /** YYYY-MM-DD */
  deadline: string | null
  recall_percentage: number | null
}

export interface DraftSubtopic {
  title: string
  content: string
}

/** The tutor's draft of the topic, updated with every reply. */
export interface Draft {
  title: string | null
  /**
   * The tutor's suggestion: usually the name of one of your categories, otherwise a new one; null
   * until the subject is clear.
   */
  category: string | null
  goal: Goal
  subtopics: DraftSubtopic[]
}

/** A conversation as `GET /conversations` lists it, without its messages. */
export interface ConversationSummary {
  id: number
  /** Null until the tutor has a title for it. */
  title: string | null
  /** Set once saved, or when it continues a saved topic. */
  topic: { id: number; title: string } | null
  is_saved: boolean
  /** Null for conversations from before drafts existed. */
  draft: Draft | null
  started_at: string
  last_activity_at: string
}

/** A conversation with all its messages, oldest first. */
export interface Conversation extends ConversationSummary {
  messages: Message[]
}

/** The body of `POST /conversations/{id}/save`: the draft as you reviewed it, complete. */
export interface ReviewedDraft {
  title: string
  /** A new topic needs one of these two; a continued topic keeps its category without either. */
  category_id?: number
  category_name?: string
  goal: {
    description: string
    deadline: string
    recall_percentage: number
  }
  subtopics: DraftSubtopic[]
}

/** What `POST /conversations/{id}/save` answers. */
export interface SaveResult {
  topic: {
    id: number
    title: string
    goal: { description: string; deadline: string; recall_percentage: number }
    subtopics: { id: number; title: string }[]
    created_at: string
  }
  added: { subtopics: number; flashcards: number; questions: number }
}

export const useConversationsStore = defineStore('conversations', () => {
  /** The chat history, latest activity first. */
  const conversations = ref<ConversationSummary[]>([])
  /** The conversation that's open right now. */
  const conversation = ref<Conversation | null>(null)

  // Keeps the history in step with a conversation we just got back, without refetching the list.
  function rememberInHistory(updatedConversation: Conversation): void {
    const summary: ConversationSummary = {
      id: updatedConversation.id,
      title: updatedConversation.title,
      topic: updatedConversation.topic,
      is_saved: updatedConversation.is_saved,
      draft: updatedConversation.draft,
      started_at: updatedConversation.started_at,
      last_activity_at: updatedConversation.last_activity_at,
    }
    const others = conversations.value.filter((existing) => existing.id !== summary.id)

    conversations.value = [summary, ...others].sort((first, second) =>
      second.last_activity_at.localeCompare(first.last_activity_at),
    )
  }

  async function fetchConversations(): Promise<void> {
    conversations.value = await api<ConversationSummary[]>('/conversations')
  }

  async function fetchConversation(id: number): Promise<Conversation> {
    const fetchedConversation = await api<Conversation>(`/conversations/${id}`)
    conversation.value = fetchedConversation

    return fetchedConversation
  }

  /**
   * Starts a conversation with your first message; the tutor's reply comes back with it. With a
   * topic it continues that topic (an open practice session).
   */
  async function startConversation(message: string, topicId?: number): Promise<Conversation> {
    const startedConversation = await api<Conversation>('/conversations', {
      method: 'POST',
      body: topicId === undefined ? { message } : { message, topic_id: topicId },
    })
    conversation.value = startedConversation
    rememberInHistory(startedConversation)

    return startedConversation
  }

  async function sendMessage(id: number, message: string): Promise<Conversation> {
    const updatedConversation = await api<Conversation>(`/conversations/${id}/messages`, {
      method: 'POST',
      body: { message },
    })
    conversation.value = updatedConversation
    rememberInHistory(updatedConversation)

    return updatedConversation
  }

  /** Saves the reviewed draft as a topic; the conversation is read-only afterwards. */
  async function saveConversation(id: number, reviewedDraft: ReviewedDraft): Promise<SaveResult> {
    const result = await api<SaveResult>(`/conversations/${id}/save`, {
      method: 'POST',
      body: reviewedDraft,
    })

    // The save answers with the topic, not the conversation, so fetch its new saved state.
    const savedConversation = await fetchConversation(id)
    rememberInHistory(savedConversation)

    return result
  }

  return {
    conversations,
    conversation,
    fetchConversations,
    fetchConversation,
    startConversation,
    sendMessage,
    saveConversation,
  }
})
