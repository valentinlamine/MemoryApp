"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function SupabaseFallback() {
  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Configuration Required</CardTitle>
          <CardDescription>Supabase integration needs to be set up</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Missing Configuration</AlertTitle>
            <AlertDescription>
              The Memory App requires Supabase to be properly configured. Please make sure you've added the Supabase
              integration and set up the required environment variables.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">To fix this issue:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Add the Supabase integration to your project</li>
              <li>Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set</li>
              <li>Refresh the page after configuration is complete</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

