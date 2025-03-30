"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { useSpaceRepetition } from "@/components/space-repetition-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import type { Flashcard } from "@/lib/supabase-schema"
import { Check, ThumbsUp, ThumbsDown, RotateCcw, AlertCircle, BookOpen } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function ReviewPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { getTodayCards, todayCards, updateCardProgress, isAuthenticated } = useSpaceRepetition()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null)
  const [isReviewCard, setIsReviewCard] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
  })
  const [authError, setAuthError] = useState(false)
  const [debugInfo, setDebugInfo] = useState({
    flashcardsCount: 0,
    reviewHistoryCount: 0,
    newCardsCount: 0,
    reviewCardsCount: 0,
  })
  const [categoryName, setCategoryName] = useState<string>("Unknown")

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true)

        // If not authenticated, redirect to login
        if (!isAuthenticated) {
          router.push("/auth/login")
          return
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("Auth error:", error)
          setAuthError(true)
          return
        }

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Get debug information
        const { data: flashcardsData, error: flashcardsError } = await supabase
          .from("flashcards")
          .select("*")
          .eq("user_id", user.id)

        const { data: reviewHistoryData, error: reviewHistoryError } = await supabase
          .from("review_history")
          .select("*")
          .eq("user_id", user.id)

        setDebugInfo({
          flashcardsCount: flashcardsData?.length || 0,
          reviewHistoryCount: reviewHistoryData?.length || 0,
          newCardsCount: 0,
          reviewCardsCount: 0,
        })

        try {
          await getTodayCards()
        } catch (error) {
          console.error("Error getting today's cards:", error)
          toast({
            variant: "destructive",
            title: "Error loading cards",
            description: "There was a problem loading your review cards.",
          })
        }
      } catch (error) {
        console.error("Error in checkUser:", error)
        setAuthError(true)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [supabase, router, getTodayCards, toast, isAuthenticated])

  useEffect(() => {
    if (!loading && !authError) {
      const total = todayCards.new.length + todayCards.review.length
      setProgress({
        total,
        completed: 0,
      })

      setDebugInfo((prev) => ({
        ...prev,
        newCardsCount: todayCards.new.length,
        reviewCardsCount: todayCards.review.length,
      }))

      getNextCard()
    }
  }, [loading, todayCards, authError])

  const getNextCard = async () => {
    setShowAnswer(false)

    // First try to get a review card
    if (todayCards.review.length > 0) {
      const reviewCardData = todayCards.review[0]
      const reviewCard = reviewCardData.flashcard

      // Get the category name
      let catName = "Unknown"

      // Check if category data is already available in the review card
      if (reviewCard.category && reviewCard.category.name) {
        catName = reviewCard.category.name
      }
      // If not, fetch the category data
      else if (reviewCard.category_id) {
        try {
          const { data: categoryData } = await supabase
            .from("categories")
            .select("name")
            .eq("id", reviewCard.category_id)
            .single()

          if (categoryData) {
            catName = categoryData.name
          }
        } catch (error) {
          console.error("Error fetching category:", error)
        }
      }

      setCategoryName(catName)

      // Map the fields to match the expected structure
      const mappedCard = {
        ...reviewCard,
        front_text: reviewCard.question,
        back_text: reviewCard.answer,
        front_image_url: reviewCard.image_url,
        back_image_url: null,
        front_audio_url: reviewCard.audio_url,
        back_audio_url: null,
        front_video_url: null,
        back_video_url: null,
        theme: { name: catName },
      }

      setCurrentCard(mappedCard)
      setIsReviewCard(true)
      return
    }

    // Then try to get a new card
    if (todayCards.new.length > 0) {
      const newCard = todayCards.new[0]

      // Get the category name
      let catName = "Unknown"

      // Check if category data is already available
      if (newCard.category && newCard.category.name) {
        catName = newCard.category.name
      }
      // If not, fetch the category data
      else if (newCard.category_id) {
        try {
          const { data: categoryData } = await supabase
            .from("categories")
            .select("name")
            .eq("id", newCard.category_id)
            .single()

          if (categoryData) {
            catName = categoryData.name
          }
        } catch (error) {
          console.error("Error fetching category:", error)
        }
      }

      setCategoryName(catName)

      // Map the fields to match the expected structure
      const mappedCard = {
        ...newCard,
        front_text: newCard.question,
        back_text: newCard.answer,
        front_image_url: newCard.image_url,
        back_image_url: null,
        front_audio_url: newCard.audio_url,
        back_audio_url: null,
        front_video_url: null,
        back_video_url: null,
        theme: { name: catName },
      }

      setCurrentCard(mappedCard)
      setIsReviewCard(false)
      return
    }

    // No more cards
    setCurrentCard(null)
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleResponse = async (quality: number) => {
    if (!currentCard) return

    try {
      await updateCardProgress(currentCard.id, quality)

      setProgress((prev) => ({
        ...prev,
        completed: prev.completed + 1,
      }))

      getNextCard()
    } catch (error) {
      console.error("Error updating card progress:", error)
      toast({
        variant: "destructive",
        title: "Error updating progress",
        description: "There was a problem updating your progress.",
      })
    }
  }

  const handleRestart = async () => {
    try {
      setLoading(true)
      await getTodayCards()
    } catch (error) {
      console.error("Error restarting review:", error)
      toast({
        variant: "destructive",
        title: "Error restarting review",
        description: "There was a problem loading your cards.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (authError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              There was a problem with your authentication. Please try logging in again.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <a href="/auth/login">Go to Login</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Review</h1>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-8" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Review</h1>

      {debugInfo.flashcardsCount === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No flashcards found</AlertTitle>
          <AlertDescription>You need to create flashcards before you can review them.</AlertDescription>
        </Alert>
      )}

      {progress.total === 0 ? (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>No Cards to Review</CardTitle>
            <CardDescription>
              You have no cards to review today. Create some flashcards or check back tomorrow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-left mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Debug Information:</h3>
              <ul className="space-y-1 text-sm">
                <li>Total flashcards: {debugInfo.flashcardsCount}</li>
                <li>Review history entries: {debugInfo.reviewHistoryCount}</li>
                <li>New cards available: {debugInfo.newCardsCount}</li>
                <li>Review cards due: {debugInfo.reviewCardsCount}</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <a href="/dashboard/flashcards">Create Flashcards</a>
            </Button>
          </CardFooter>
        </Card>
      ) : currentCard ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {progress.completed} of {progress.total} cards reviewed
              </p>
              <Progress value={(progress.completed / progress.total) * 100} className="h-2 mt-2 w-64" />
            </div>
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
          </div>

          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-center">{isReviewCard ? "Review Card" : "New Card"}</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {categoryName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <Tabs defaultValue="card" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card">Card</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  <TabsContent value="card" className="p-4">
                    <div className="min-h-[300px] flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        {!showAnswer ? (
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold">{currentCard.front_text}</h3>
                            {currentCard.front_image_url && (
                              <img
                                src={currentCard.front_image_url || "/placeholder.svg"}
                                alt="Front side"
                                className="max-h-40 mx-auto rounded-md"
                              />
                            )}
                            {currentCard.front_audio_url && (
                              <audio controls className="w-full">
                                <source src={currentCard.front_audio_url} />
                              </audio>
                            )}
                            {currentCard.front_video_url && (
                              <video controls className="max-h-40 w-full">
                                <source src={currentCard.front_video_url} />
                              </video>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold">{currentCard.back_text}</h3>
                            {currentCard.back_image_url && (
                              <img
                                src={currentCard.back_image_url || "/placeholder.svg"}
                                alt="Back side"
                                className="max-h-40 mx-auto rounded-md"
                              />
                            )}
                            {currentCard.back_audio_url && (
                              <audio controls className="w-full">
                                <source src={currentCard.back_audio_url} />
                              </audio>
                            )}
                            {currentCard.back_video_url && (
                              <video controls className="max-h-40 w-full">
                                <source src={currentCard.back_video_url} />
                              </video>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="details" className="p-4">
                    <div className="min-h-[300px] space-y-4">
                      <div>
                        <h3 className="font-medium">Category</h3>
                        <p className="text-sm text-muted-foreground">{categoryName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium">Question</h3>
                          <p className="text-sm text-muted-foreground">{currentCard.front_text}</p>
                        </div>
                        <div>
                          <h3 className="font-medium">Answer</h3>
                          <p className="text-sm text-muted-foreground">{currentCard.back_text}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              {!showAnswer ? (
                <Button onClick={handleShowAnswer} className="w-full max-w-xs">
                  Show Answer
                </Button>
              ) : (
                <div className="flex gap-2 w-full max-w-md justify-between">
                  <Button variant="destructive" onClick={() => handleResponse(1)}>
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Hard
                  </Button>
                  <Button variant="outline" onClick={() => handleResponse(3)}>
                    <Check className="h-4 w-4 mr-2" />
                    Good
                  </Button>
                  <Button variant="default" onClick={() => handleResponse(5)}>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Easy
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>All Done!</CardTitle>
            <CardDescription>You have completed all your reviews for today. Great job!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-6">
              <p className="text-4xl font-bold">🎉</p>
              <p className="mt-4">You reviewed {progress.completed} cards today.</p>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Check for More Cards
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

