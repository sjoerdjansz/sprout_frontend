import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

/*
 * The flashcards of the subtopic that's open on the subtopic page (`../API.md`, "Subtopic page").
 */

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface Flashcard {
  id: number
  subtopic_id: number
  front: string
  back: string
  /** `ai` for generated cards, `user` for cards you wrote. */
  origin: 'ai' | 'user'
  /** A paused card is never due and doesn't count for due cards, recall or slipping. */
  paused: boolean
  /** Not paused and due by the end of today ("Due today"). */
  is_due: boolean
  /** YYYY-MM-DD; also set for a paused card (when it's due once you resume it). */
  due_on: string
  /** Null until the card has been reviewed. */
  last_rating: Rating | null
  last_reviewed_at: string | null
  /** 0–100, the expected chance you remember it now; null until it has been reviewed. */
  recall: number | null
  created_at: string
}

export interface FlashcardInput {
  front: string
  back: string
}

export const useFlashcardsStore = defineStore('flashcards', () => {
  /** Oldest first, paused ones included. */
  const flashcards = ref<Flashcard[]>([])

  function replace(updated: Flashcard): void {
    flashcards.value = flashcards.value.map((card) => (card.id === updated.id ? updated : card))
  }

  async function fetchFlashcards(subtopicId: number): Promise<void> {
    flashcards.value = await api<Flashcard[]>(`/subtopics/${subtopicId}/flashcards`)
  }

  /** Adds a card you wrote; it's due straight away. */
  async function addFlashcard(subtopicId: number, input: FlashcardInput): Promise<Flashcard> {
    const card = await api<Flashcard>(`/subtopics/${subtopicId}/flashcards`, {
      method: 'POST',
      body: input,
    })
    flashcards.value.push(card)

    return card
  }

  /** Changes the front and back; the schedule and review history stay. */
  async function editFlashcard(cardId: number, input: FlashcardInput): Promise<Flashcard> {
    const card = await api<Flashcard>(`/flashcards/${cardId}`, { method: 'PUT', body: input })
    replace(card)

    return card
  }

  async function setPaused(cardId: number, paused: boolean): Promise<Flashcard> {
    const card = await api<Flashcard>(`/flashcards/${cardId}/${paused ? 'pause' : 'resume'}`, {
      method: 'POST',
    })
    replace(card)

    return card
  }

  /** Deletes a card with its review history. */
  async function deleteFlashcard(cardId: number): Promise<void> {
    await api<null>(`/flashcards/${cardId}`, { method: 'DELETE' })
    flashcards.value = flashcards.value.filter((card) => card.id !== cardId)
  }

  return { flashcards, fetchFlashcards, addFlashcard, editFlashcard, setPaused, deleteFlashcard }
})
