"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { usePathname } from "next/navigation"

// Define the spaced repetition algorithm levels
const LEVELS = [
  { days: 0 }, // Level 0: Same day
  { days: 1 }, // Level 1: Next day
  { days: 3 }, // Level 2: 3 days later
  { days: 7 }, // Level 3: 1 week later
  { days: 14 }, // Level 4: 2 weeks later
  { days: 30 }, // Level 5: 1 month later
]

const SpaceRepetitionContext = createContext(null)

export function SpaceRepetitionProvider({ children }) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const pathname = usePathname()
  const [settings, setSettings] = useState({
    cardsPerDay: 20,
  })
  const [todayCards, setTodayCards] = useState({
    new: [],
    review: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const authListenerRef = useRef(null)
  const authCheckedRef = useRef(false)
  const settingsLoadedRef = useRef(false)

  // Memoize loadSettings to prevent unnecessary re-renders
  const loadSettings = useCallback(
    async (user) => {
      if (!user || settingsLoadedRef.current) {
        return
      }

      try {
        setError(null)

        const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading settings:", error)
          setError(error)
        } else if (data) {
          setSettings({
            cardsPerDay: data.cards_per_day || 20,
          })
        }

        settingsLoadedRef.current = true
      } catch (error) {
        console.error("Error in loadSettings:", error)
        setError(error)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  // Check if user is authenticated
  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      // Prevent multiple auth checks
      if (authCheckedRef.current) return

      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Session check error:", error)
          if (mounted) {
            setIsAuthenticated(false)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          const hasSession = !!data.session
          setIsAuthenticated(hasSession)

          // Only load settings if we're on a protected route and authenticated
          if (hasSession && pathname.startsWith("/dashboard")) {
            await loadSettings(data.session.user)
          } else {
            setLoading(false)
          }
        }

        authCheckedRef.current = true
      } catch (error) {
        console.error("Auth check error:", error)
        if (mounted) {
          setIsAuthenticated(false)
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return

        const hasSession = !!session
        setIsAuthenticated(hasSession)

        if (event === "SIGNED_IN" && pathname.startsWith("/dashboard")) {
          loadSettings(session.user)
        } else if (event === "SIGNED_OUT") {
          // Reset state when signed out
          setSettings({
            cardsPerDay: 20,
          })
          setTodayCards({
            new: [],
            review: [],
          })
          settingsLoadedRef.current = false
        }
      })

      // Store the subscription reference safely
      if (data && data.subscription) {
        authListenerRef.current = data.subscription
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error)
    }

    return () => {
      mounted = false

      // Safely unsubscribe using the ref
      if (authListenerRef.current && typeof authListenerRef.current.unsubscribe === "function") {
        try {
          authListenerRef.current.unsubscribe()
        } catch (error) {
          console.error("Error unsubscribing from auth listener:", error)
        }
      }
    }
  }, [supabase, pathname, loadSettings])

  // Memoize getTodayCards to prevent unnecessary re-renders
  const getTodayCards = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("getTodayCards called when not authenticated")
      return
    }

    try {
      setError(null)
      console.log("Getting today's cards...")

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Auth error in getTodayCards:", userError)
        setError(userError)
        return
      }

      const user = userData.user
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get cards due for review
      try {
        // Use the review_history table instead of flashcard_progress
        const { data: reviewCards, error: reviewError } = await supabase
          .from("review_history")
          .select(`
            *,
            flashcard:flashcard_id(*)
          `)
          .eq("user_id", user.id)
          .lte("next_review_date", today.toISOString())
          .order("next_review_date")

        if (reviewError) {
          console.error("Error fetching review cards:", reviewError)
          setError(reviewError)
          return
        }

        console.log("Review cards found:", reviewCards?.length || 0)

        // Get new cards (cards without review history)
        const { data: allFlashcards, error: flashcardsError } = await supabase
          .from("flashcards")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at")

        if (flashcardsError) {
          console.error("Error fetching flashcards:", flashcardsError)
          setError(flashcardsError)
          return
        }

        console.log("All flashcards found:", allFlashcards?.length || 0)

        // Get all review history entries for the user
        const { data: allReviews, error: reviewsError } = await supabase
          .from("review_history")
          .select("flashcard_id")
          .eq("user_id", user.id)

        if (reviewsError) {
          console.error("Error fetching review history:", reviewsError)
          setError(reviewsError)
          return
        }

        console.log("Review history entries:", allReviews?.length || 0)

        // Filter out cards that already have review history
        const reviewedFlashcardIds = allReviews?.map((p) => p.flashcard_id) || []
        const newCards = allFlashcards?.filter((card) => !reviewedFlashcardIds.includes(card.id)) || []

        console.log("New cards available for review:", newCards.length)
        console.log("Cards per day setting:", settings.cardsPerDay)

        setTodayCards({
          new: newCards.slice(0, settings.cardsPerDay),
          review: reviewCards || [],
        })

        console.log("Today's cards set:", {
          new: newCards.slice(0, settings.cardsPerDay).length,
          review: reviewCards?.length || 0,
        })
      } catch (dbError) {
        console.error("Database error in getTodayCards:", dbError)
        setError(dbError)
      }
    } catch (error) {
      console.error("Error in getTodayCards:", error)
      setError(error)
    }
  }, [isAuthenticated, supabase, settings.cardsPerDay])

  // Memoize updateCardProgress to prevent unnecessary re-renders
  const updateCardProgress = useCallback(
    async (flashcardId, score) => {
      if (!isAuthenticated) {
        console.warn("updateCardProgress called when not authenticated")
        return
      }

      try {
        setError(null)

        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error("Auth error in updateCardProgress:", userError)
          setError(userError)
          return
        }

        const user = userData.user
        if (!user) return

        // Calculate next review date based on score
        const nextReviewDate = new Date()
        let daysToAdd = 1 // Default

        // Simple spaced repetition algorithm
        // 1 = Again (1 day)
        // 2 = Hard (3 days)
        // 3 = Good (7 days)
        // 4 = Easy (14 days)
        // 5 = Very Easy (30 days)
        switch (score) {
          case 1:
            daysToAdd = 1
            break
          case 2:
            daysToAdd = 3
            break
          case 3:
            daysToAdd = 7
            break
          case 4:
            daysToAdd = 14
            break
          case 5:
            daysToAdd = 30
            break
          default:
            daysToAdd = 1
        }

        nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd)

        // Insert new review history entry
        const { error: insertError } = await supabase.from("review_history").insert({
          user_id: user.id,
          flashcard_id: flashcardId,
          score: score,
          next_review_date: nextReviewDate.toISOString(),
        })

        if (insertError) {
          console.error("Error inserting review history:", insertError)
          setError(insertError)
          return
        }

        // Update the UI by removing the reviewed card
        setTodayCards((prev) => {
          const newCards = [...prev.new]
          const reviewCards = [...prev.review]

          // Remove from new cards if it was there
          const newCardIndex = newCards.findIndex((card) => card.id === flashcardId)
          if (newCardIndex !== -1) {
            newCards.splice(newCardIndex, 1)
          }

          // Remove from review cards if it was there
          const reviewCardIndex = reviewCards.findIndex((card) => card.flashcard?.id === flashcardId)
          if (reviewCardIndex !== -1) {
            reviewCards.splice(reviewCardIndex, 1)
          }

          return { new: newCards, review: reviewCards }
        })

        toast({
          title: "Progress updated",
          description: `Card will be reviewed again in ${daysToAdd} days`,
        })
      } catch (error) {
        console.error("Error in updateCardProgress:", error)
        setError(error)
      }
    },
    [isAuthenticated, supabase, toast],
  )

  const value = {
    settings,
    todayCards,
    loading,
    error,
    isAuthenticated,
    getTodayCards,
    updateCardProgress,
  }

  return <SpaceRepetitionContext.Provider value={value}>{children}</SpaceRepetitionContext.Provider>
}

export const useSpaceRepetition = () => {
  const context = useContext(SpaceRepetitionContext)
  if (context === null) {
    throw new Error("useSpaceRepetition must be used within a SpaceRepetitionProvider")
  }
  return context
}

