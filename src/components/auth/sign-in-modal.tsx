"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Loader2 } from "lucide-react"

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && emailInputRef.current) {
      // Small delay to allow animation to complete
      setTimeout(() => {
        emailInputRef.current?.focus()
      }, 100)
      // Load remember me preference from localStorage
      const savedRememberMe = localStorage.getItem("rememberMe")
      if (savedRememberMe === "true") {
        setRememberMe(true)
      }
    } else if (!open) {
      // Reset state when modal closes
      setEmail("")
      setError(null)
      setSent(false)
    }
  }, [open])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Save remember me preference to localStorage
    localStorage.setItem("rememberMe", rememberMe.toString())

    const supabase = createSupabaseBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    })

    if (signInError) {
      setError(signInError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !loading) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md modal-slide-up"
        onKeyDown={handleKeyDown}
        aria-labelledby="sign-in-title"
        aria-describedby="sign-in-description"
        role="dialog"
      >
        <DialogHeader className="text-center">
          <DialogTitle id="sign-in-title" className="text-2xl font-semibold">
            Sign in
          </DialogTitle>
          <DialogDescription id="sign-in-description" className="text-sm text-muted-foreground">
            Sign in with your email to receive a magic link for account access.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
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
        ) : (
          <div className="space-y-4">
            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                {error && (
                  <p
                    id="email-error"
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
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

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  // Same modal for login, just different text
                  onOpenChange(false)
                  // Could open sign-up modal if needed
                }}
                className="text-primary hover:underline font-medium"
                aria-label="Sign in instead"
              >
                Login
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

