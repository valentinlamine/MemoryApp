export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          id: string
          created_at: string
          card_number: number
          question: string
          answer: string
          image_url: string | null
          audio_url: string | null
          difficulty: number
          category_id: string
          user_id: string
          next_review: string | null
          last_reviewed: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          card_number?: number
          question: string
          answer: string
          image_url?: string | null
          audio_url?: string | null
          difficulty?: number
          category_id: string
          user_id: string
          next_review?: string | null
          last_reviewed?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          card_number?: number
          question?: string
          answer?: string
          image_url?: string | null
          audio_url?: string | null
          difficulty?: number
          category_id?: string
          user_id?: string
          next_review?: string | null
          last_reviewed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_history: {
        Row: {
          id: string
          created_at: string
          flashcard_id: string
          user_id: string
          performance_rating: number
          review_time: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          flashcard_id: string
          user_id: string
          performance_rating: number
          review_time?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          flashcard_id?: string
          user_id?: string
          performance_rating?: number
          review_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_history_flashcard_id_fkey"
            columns: ["flashcard_id"]
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          id: string
          created_at: string
          user_id: string
          daily_review_goal: number
          theme: string
          notifications_enabled: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          daily_review_goal?: number
          theme?: string
          notifications_enabled?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          daily_review_goal?: number
          theme?: string
          notifications_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_review: {
        Args: {
          current_difficulty: number
          performance_rating: number
        }
        Returns: string
      }
      get_cards_due_for_review: {
        Args: {
          p_user_id: string
          p_limit: number
        }
        Returns: {
          id: string
          card_number: number
          question: string
          answer: string
          image_url: string
          audio_url: string
          difficulty: number
          category_id: string
          category_name: string
          next_review: string
          last_reviewed: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

