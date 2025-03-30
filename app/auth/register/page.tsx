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
import { AlertCircle, Check, Info, Mail, X } from "lucide-react"

export default function RegisterPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | React.ReactNode | null>(null)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Password requirements
  const passwordRequirements = [
    { text: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { text: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { text: "At least one lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { text: "At least one number", test: (p: string) => /[0-9]/.test(p) },
  ]

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError(null)
  }, [email, password, confirmPassword])

  const validatePassword = () => {
    return passwordRequirements.every((req) => req.test(password))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRegistrationSuccess(false)

    // Check if email is valid
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password requirements
    if (!validatePassword()) {
      setError("Password does not meet all requirements")
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error("Registration error:", signUpError)

        // Handle specific error cases
        if (signUpError.message.includes("already registered") || signUpError.message.includes("email exists")) {
          setError(
            <div>
              This email is already registered. Please{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                log in
              </Link>{" "}
              instead or use a different email address.
            </div>,
          )
        } else if (signUpError.message.includes("rate limit")) {
          setError("Too many attempts. Please try again later.")
        } else if (signUpError.message.includes("weak password")) {
          setError("Your password is too weak. Please choose a stronger password.")
        } else {
          setError(signUpError.message || "An unknown error occurred during registration")
        }
      } else if (data) {
        // Check if user was created
        if (data.user) {
          setRegistrationSuccess(true)
          toast({
            title: "Registration successful",
            description: "Please check your email to verify your account.",
          })
          // Don't redirect immediately - show the success message first
        } else {
          setError("Unable to create user account. Please try again.")
        }
      }
    } catch (error) {
      console.error("Unexpected error during registration:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
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
      setError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again later.")
    }
  }

  // If registration is successful, show a different UI
  if (registrationSuccess) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[80vh] bg-background text-foreground">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto rounded-full bg-primary/10 p-4 mb-4 w-20 h-20 flex items-center justify-center text-primary">
              <Mail className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to <span className="font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-muted">
              <Info className="h-4 w-4" />
              <AlertTitle>What happens next?</AlertTitle>
              <AlertDescription className="mt-2">
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Once verified, you can log in to your account</li>
                </ol>
              </AlertDescription>
            </Alert>
            <div className="text-center text-sm text-muted-foreground">
              Didn't receive an email? Check your spam folder or try again in a few minutes.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="outline" className="w-full" onClick={() => router.push("/auth/login")}>
              Go to Login
            </Button>
            <Button variant="link" className="w-full" onClick={() => setRegistrationSuccess(false)}>
              Back to Registration
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] bg-background text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>Create an account to start using MemoryApp</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
              />

              {passwordFocused && (
                <div className="mt-2 text-sm space-y-1">
                  <p className="font-medium">Password requirements:</p>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2">
                        {req.test(password) ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className={req.test(password) ? "text-green-500" : "text-muted-foreground"}>
                          {req.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
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

          <Button variant="outline" type="button" className="w-full" onClick={handleGoogleRegister}>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

