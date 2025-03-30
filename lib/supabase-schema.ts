// TypeScript definitions for the simplified schema

export type Category = {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Flashcard = {
  id: string
  user_id: string
  category_id: string
  card_number: number
  question: string
  answer: string
  image_url: string | null
  audio_url: string | null
  difficulty: number
  created_at: string
  updated_at: string
  category?: Category
}

export type ReviewHistory = {
  id: string
  user_id: string
  flashcard_id: string
  review_date: string
  score: number
  next_review_date: string
  flashcard?: Flashcard
}

export type UserSettings = {
  id: string
  user_id: string
  cards_per_day: number
  created_at: string
  updated_at: string
}

