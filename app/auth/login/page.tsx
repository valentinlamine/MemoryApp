"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

export default function LoginPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // Get URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get("verified")
    const reset = params.get("reset")

    if (verified === "true") {
      setInfoMessage("Your email has been verified. You can now log in.")
    } else if (reset === "true") {
      setInfoMessage("Your password has been reset. Please log in with your new password.")
    }
  }, [])

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError(null)
  }, [email, password])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfoMessage(null)

    // Check if email is valid
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    // Check if password is entered
    if (!password) {
      setError("Please enter your password")
      setLoading(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Handle specific error types
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email address before logging in. Check your inbox for a verification link.")
        } else if (signInError.message.includes("rate limit")) {
          setError("Too many login attempts. Please try again later.")
        } else if (signInError.message.includes("User not found")) {
          setError("No account found with this email. Please check your email or register for a new account.")
        } else {
          setError(signInError.message || "Failed to log in. Please try again.")
        }
      } else if (data?.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          setError("Your email is not verified. Please check your inbox for a verification link.")
          setLoading(false)
          return
        }

        // Force navigation to dashboard
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        })

        // Set a slight delay before redirecting to ensure toast is shown
        setTimeout(() => {
          // Use a hard redirect to dashboard
          window.location.href = "/dashboard"
        }, 500)
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) {
        if (signInError.message.includes("rate limit")) {
          setError("Too many attempts. Please try again later.")
        } else {
          setError(signInError.message || "Failed to sign in with Google")
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.")
    }
  }

  const handleResendVerification = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address to resend verification")
      return
    }

    setLoading(true)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) {
        setError(resendError.message || "Failed to resend verification email")
      } else {
        setInfoMessage("Verification email resent. Please check your inbox.")
        toast({
          title: "Email sent",
          description: "Verification email has been resent to your inbox.",
        })
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] bg-background text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("email is not verified") && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-destructive-foreground underline ml-1"
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    Resend verification email
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {infoMessage && (
            <Alert className="mb-4 bg-primary/10 text-primary">
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

