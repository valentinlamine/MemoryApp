"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function EnvironmentCheck() {
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    // We're using hardcoded credentials, so no need to check for environment variables
    setMissingVars([])
  }, [])

  if (missingVars.length === 0) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing Environment Variables</AlertTitle>
      <AlertDescription>
        <p>The following environment variables are missing:</p>
        <ul className="list-disc pl-5 mt-2">
          {missingVars.map((varName) => (
            <li key={varName}>{varName}</li>
          ))}
        </ul>
        <p className="mt-2">Please add these to your .env.local file or Vercel project settings.</p>
      </AlertDescription>
    </Alert>
  )
}

