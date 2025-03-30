"use client"

import { useEffect } from "react"

export default function EnvSetup() {
  useEffect(() => {
    // Check if Supabase environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables are not set!")
    }
  }, [])

  return null
}

