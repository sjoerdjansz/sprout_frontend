import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

/*
 * The questions of the subtopic that's open on the subtopic page (`../API.md`, "Subtopic page").
 */

/** `feynman` is "Explain it". */
export type QuestionType = 'multiple_choice' | 'open' | 'feynman'

/** `almost`: not right, but a score of 50 or more. */
export type Verdict = 'correct' | 'almost' | 'not_quite'

export interface QuestionOption {
  id: number
  label: string
  is_correct: boolean
  explanation: string | null
}

/** A part of an explanation Sprout asks about: `text` is quoted exactly from it. */
export interface Gap {
  text: string
  note: string
}

/** Your most recent graded answer. */
export interface LatestAnswer {
  /** What you typed, for open and Explain it questions. */
  response: string | null
  /** The option you picked, for multiple choice. */
  option_id: number | null
  score: number
  verdict: Verdict
  feedback: string
  /** Explain it only: the gaps Sprout found; null for other questions. */
  gaps: Gap[] | null
  answered_at: string
}

export interface Question {
  id: number
  subtopic_id: number
  type: QuestionType
  prompt: string
  origin: 'ai' | 'user'
  /** In order; empty for open and Explain it questions. */
  options: QuestionOption[]
  /** Null when you haven't had a graded answer yet ("Not answered yet"). */
  latest_answer: LatestAnswer | null
  created_at: string
}

export const useQuestionsStore = defineStore('questions', () => {
  /** Oldest first, answered or not. */
  const questions = ref<Question[]>([])

  async function fetchQuestions(subtopicId: number): Promise<void> {
    questions.value = await api<Question[]>(`/subtopics/${subtopicId}/questions`)
  }

  /** Deletes a question with its options and all answers to it. */
  async function deleteQuestion(questionId: number): Promise<void> {
    await api<null>(`/questions/${questionId}`, { method: 'DELETE' })
    questions.value = questions.value.filter((question) => question.id !== questionId)
  }

  return { questions, fetchQuestions, deleteQuestion }
})
