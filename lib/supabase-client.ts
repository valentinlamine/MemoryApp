import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  "https://eyzghfzylramaxsucitc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5emdoZnp5bHJhbWF4c3VjaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzU2OTksImV4cCI6MjA1ODkxMTY5OX0.PEYxr347-sQ9oVrRZraASQepq54CbPy03IhphJs3Woc",
)

