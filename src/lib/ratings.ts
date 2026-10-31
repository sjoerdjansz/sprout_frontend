/*
 * How a card rating reads in the app. The API keeps Anki's grades (again, hard, good, easy); you
 * first say whether you knew the card, and only a card you knew gets a grade for how easily.
 */
import type { Rating } from '@/stores/flashcards'

export const ratingLabels: Record<Rating, string> = {
  again: 'Missed it',
  hard: 'Tricky',
  good: 'Solid',
  easy: 'Easy',
}
