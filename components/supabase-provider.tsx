"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

const SupabaseContext = createContext(null)

export function SupabaseProvider({ children }) {
  // Initialize Supabase client without explicit parameters since env vars are available
  const [supabase] = useState(() => {
    try {
      // Use the provided credentials
      return createClientComponentClient({
        supabaseUrl: "https://eyzghfzylramaxsucitc.supabase.co",
        supabaseKey:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5emdoZnp5bHJhbWF4c3VjaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzU2OTksImV4cCI6MjA1ODkxMTY5OX0.PEYxr347-sQ9oVrRZraASQepq54CbPy03IhphJs3Woc",
      })
    } catch (error) {
      console.error("Error creating Supabase client:", error)
      // Return a minimal client that won't throw errors when methods are called
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: new Error("Supabase client initialization failed") }),
          getSession: async () => ({
            data: { session: null },
            error: new Error("Supabase client initialization failed"),
          }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signOut: async () => ({ error: null }),
          signUp: async () => ({ data: null, error: new Error("Supabase client initialization failed") }),
          signInWithOAuth: async () => ({ data: null, error: new Error("Supabase client initialization failed") }),
        },
        from: () => ({
          select: () => ({ limit: () => ({ single: async () => ({ data: null, error: null }) }) }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
          eq: () => ({ order: () => ({ data: null, error: null }) }),
        }),
        storage: {
          from: () => ({
            upload: async () => ({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: "" } }),
          }),
        },
      }
    }
  })

  const { toast } = useToast()
  const subscriptionRef = useRef(null)

  useEffect(() => {
    try {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          toast({
            title: "Signed in successfully",
            description: "Welcome to MemoryApp!",
          })
        }
        if (event === "SIGNED_OUT") {
          toast({
            title: "Signed out successfully",
            description: "You have been signed out.",
          })
        }
      })

      // Store the subscription reference safely
      if (data && data.subscription) {
        subscriptionRef.current = data.subscription
      }

      return () => {
        // Safely unsubscribe using the ref
        if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === "function") {
          try {
            subscriptionRef.current.unsubscribe()
          } catch (error) {
            console.error("Error unsubscribing from auth state change:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error setting up auth state change listener:", error)
      return () => {}
    }
  }, [supabase, toast])

  return <SupabaseContext.Provider value={{ supabase }}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === null) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}

