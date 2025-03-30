"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(null)
  const authListenerRef = useRef(null)
  const authCheckedRef = useRef(false)
  const redirectingRef = useRef(false)

  // Memoize the auth check function
  const checkAuth = useCallback(async () => {
    // Prevent multiple auth checks
    if (authCheckedRef.current || redirectingRef.current) return

    try {
      // Get user session - use try/catch to handle potential errors
      const { data, error } = await supabase.auth.getSession()

      // If no session, redirect to login
      if (!data?.session || error) {
        if (!redirectingRef.current) {
          redirectingRef.current = true
          console.log("No valid session found, redirecting to login")
          router.push("/auth/login")
        }
        return false
      }

      // If we have a session and not on setup page, check database
      if (data?.session && pathname !== "/setup") {
        try {
          const { error } = await supabase.from("categories").select("id").limit(1)

          if (error && error.message.includes("does not exist")) {
            setDbError("Database tables not set up")
          }
        } catch (dbError) {
          console.error("Database check error:", dbError)
        }
      }

      authCheckedRef.current = true
      return true
    } catch (authError) {
      console.error("Auth check error:", authError)
      if (!redirectingRef.current) {
        redirectingRef.current = true
        router.push("/auth/login")
      }
      return false
    }
  }, [supabase, router, pathname])

  // Single useEffect for auth check
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const isAuthenticated = await checkAuth()

      if (!mounted) return

      if (isAuthenticated) {
        setLoading(false)
      }
    }

    initAuth()

    // Set up auth state listener with error handling
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return

        if (event === "SIGNED_OUT") {
          if (!redirectingRef.current) {
            redirectingRef.current = true
            router.push("/auth/login")
          }
        }
      })

      // Store the subscription reference safely
      if (data && data.subscription) {
        authListenerRef.current = data.subscription
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error)
    }

    // Cleanup function
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
  }, [supabase, router, pathname, checkAuth])

  if (loading) {
    return <div className="p-8 bg-background text-foreground">Loading dashboard...</div>
  }

  if (dbError && pathname !== "/setup") {
    return (
      <div className="container mx-auto px-4 py-8 bg-background text-foreground">
        <Card className="text-center p-8 max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Database Setup Required</CardTitle>
            <CardDescription>The database tables have not been set up yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Before you can use the Memory App, you need to set up the database tables. This is a one-time setup
              process.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/setup">Go to Setup Page</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Return children directly without any wrapper that might override theme
  return children
}

