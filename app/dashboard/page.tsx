"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { useSpaceRepetition } from "@/components/space-repetition-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Brain, Layers, Plus } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { getTodayCards, todayCards, isAuthenticated, loading: spaceRepetitionLoading } = useSpaceRepetition()
  const [stats, setStats] = useState({
    categories: 0,
    flashcards: 0,
    reviewsDue: 0,
    reviewsCompleted: 0,
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Memoize loadStats to prevent unnecessary re-renders
  const loadStats = useCallback(async () => {
    if (!user) return

    try {
      // Get categories count
      const { count: categoriesCount, error: categoriesError } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError)
      }

      // Get flashcards count
      const { count: flashcardsCount, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (flashcardsError) {
        console.error("Error fetching flashcards:", flashcardsError)
      }

      // Get reviews due count
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: reviewsDueCount, error: reviewsDueError } = await supabase
        .from("review_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review_date", today.toISOString())

      if (reviewsDueError) {
        console.error("Error fetching reviews due:", reviewsDueError)
      }

      // Get reviews completed today
      const { count: reviewsCompletedCount, error: reviewsCompletedError } = await supabase
        .from("review_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("review_date", today.toISOString())

      if (reviewsCompletedError) {
        console.error("Error fetching reviews completed:", reviewsCompletedError)
      }

      setStats({
        categories: categoriesCount || 0,
        flashcards: flashcardsCount || 0,
        reviewsDue: reviewsDueCount || 0,
        reviewsCompleted: reviewsCompletedCount || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }, [supabase, user])

  // Single useEffect for auth check
  useEffect(() => {
    let isMounted = true

    const checkUser = async () => {
      try {
        // Only check auth once
        if (authChecked) return

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("Auth error:", error)
          if (isMounted) {
            router.push("/auth/login")
          }
          return
        }

        if (!user) {
          if (isMounted) {
            router.push("/auth/login")
          }
          return
        }

        if (isMounted) {
          setUser(user)
          setAuthChecked(true)
        }
      } catch (error) {
        console.error("Error checking user:", error)
        if (isMounted) {
          router.push("/auth/login")
        }
      }
    }

    checkUser()

    return () => {
      isMounted = false
    }
  }, [supabase, router, authChecked])

  // Separate useEffect for loading data after auth is confirmed
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!user || !isAuthenticated) return

      setLoading(true)

      try {
        await loadStats()

        // Only get today's cards if we're authenticated
        await getTodayCards()
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user, isAuthenticated, loadStats, getTodayCards])

  // Show loading state only on initial load
  if (!authChecked || (loading && !user)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center">
              <Layers className="h-8 w-8 mr-2 text-primary" />
              <span className="text-3xl font-bold">{stats.categories}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/dashboard/categories">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Flashcards</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center">
              <Brain className="h-8 w-8 mr-2 text-primary" />
              <span className="text-3xl font-bold">{stats.flashcards}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/dashboard/flashcards">
                <Plus className="h-4 w-4 mr-2" />
                Add Flashcard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>




      <Tabs defaultValue="today" className="w-full">
        {/* <TabsList className="mb-4"> */}
          {/* <TabsTrigger value="today">Today's Review</TabsTrigger> */}
          {/* <TabsTrigger value="progress">Progress</TabsTrigger> */}
        {/* </TabsList> */}

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Today's Review</CardTitle>
              <CardDescription>
                You have {todayCards.new.length + todayCards.review.length} cards to review today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>New cards</span>
                    <span>{todayCards.new.length}</span>
                  </div>
                  <Progress value={(todayCards.new.length / (stats.flashcards || 1)) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Review cards</span>
                    <span>{todayCards.review.length}</span>
                  </div>
                  <Progress value={(todayCards.review.length / (stats.reviewsDue || 1)) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Completed today</span>
                    <span>{stats.reviewsCompleted}</span>
                  </div>
                  <Progress
                    value={(stats.reviewsCompleted / (stats.reviewsDue + stats.reviewsCompleted || 1)) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/dashboard/review">Start Review</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Track your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Mastered cards</span>
                    <span>Coming soon</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Learning cards</span>
                    <span>Coming soon</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>New cards</span>
                    <span>Coming soon</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/statistics">View Detailed Statistics</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent> */}

      </Tabs>


    </div>
  )
}

