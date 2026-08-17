"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [usePassword, setUsePassword] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Load remember me preference from localStorage on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem("rememberMe")
    if (savedRememberMe === "true") {
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Save remember me preference to localStorage
    localStorage.setItem("rememberMe", rememberMe.toString())

    const supabase = createSupabaseBrowserClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

    if (usePassword && password) {
      // Try password authentication first
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // If password auth fails, check if it's because user doesn't have a password
        // or if it's an invalid password
        if (signInError.message.includes("Invalid login credentials") || 
            signInError.message.includes("Email not confirmed")) {
          setError("Invalid email or password. Please try again or use magic link.")
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // Password login successful - redirect to dashboard
      if (data.session) {
        router.push("/dashboard")
        return
      }
    } else {
      // Use magic link authentication
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        setSent(true)
      }
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="py-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Check your email</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We sent you a magic sign-in link. Click the link in your email to access your account.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSent(false)
              setEmail("")
            }}
            className="w-full"
          >
            Use a different email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div
          className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            ref={emailInputRef}
            type="email"
            placeholder="my@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-12 transition-all duration-200 focus:scale-[1.02]"
            aria-label="Email address"
            aria-required="true"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "email-error" : undefined}
          />
        </div>

        {usePassword && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                href="/auth/reset-password"
                className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required={usePassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12 pr-10 transition-all duration-200 focus:scale-[1.02]"
                aria-label="Password"
                aria-required={usePassword ? "true" : "false"}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Remember Me Checkbox */}
        {usePassword && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={loading}
              aria-label="Remember me for automatic login"
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-normal cursor-pointer"
            >
              Remember me
            </Label>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !email || (usePassword && !password)}
          className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              {usePassword ? "Signing in..." : "Sending..."}
            </>
          ) : (
            <>
              {usePassword ? (
                <>
                  <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
                  Sign In
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                  Send Magic Link
                </>
              )}
            </>
          )}
        </Button>

        {/* Toggle between password and magic link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setUsePassword(!usePassword)
              setPassword("")
              setError(null)
            }}
            className="text-xs sm:text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {usePassword 
              ? "Use magic link instead" 
              : "Sign in with password instead"}
          </button>
        </div>
      </form>
    </div>
  )
}

