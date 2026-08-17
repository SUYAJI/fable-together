"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Users, Sparkles, Mic, Headphones, Heart, CheckCircle, Lock, Eye, EyeOff, Mail } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function AuthLandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [usePassword, setUsePassword] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const supabase = createSupabaseBrowserClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    
    if (usePassword && password) {
      // Try password authentication first
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    }
    
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center p-4">
        <Card className="max-w-md w-full card-elevated">
          <CardContent className="p-8 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 micro-bounce">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">Check your email</h1>
            <p className="text-body mb-8">
              We sent you a magic sign-in link. Click the link in your email to access your dashboard.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSent(false)
                setEmail("")
              }}
              className="btn-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Try a different email address"
            >
              Try different email
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Header */}
      <header className="app-header p-4 sm:p-6" role="banner">
        <div className="content-container">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary hover-lift">
              <BookOpen className="h-5 w-5 sm:h-7 sm:w-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-xl sm:text-2xl font-semibold text-primary">Fable Together</span>
            <Badge 
              variant="outline" 
              className="bg-orange-500/10 text-orange-600 border-orange-500/50 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50 font-semibold text-xs sm:text-sm"
              aria-label="Beta version"
            >
              BETA
            </Badge>
          </div>
        </div>
      </header>

      <div className="content-container py-8 sm:py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-foreground">
            Create Magical Stories with Your Family
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Transform your family&apos;s voices into enchanting narrators. Create personalized stories that bring your loved ones&apos; voices to life with AI-powered storytelling.
          </p>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary">
              <Mic className="h-4 w-4" />
              <span className="text-sm font-medium">Voice Cloning</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent-warm/10 rounded-full text-accent-warm">
              <Headphones className="h-4 w-4" />
              <span className="text-sm font-medium">AI Narration</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Family Stories</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Sign Up Card */}
          <Card className="card-elevated">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 hover-lift">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-3 text-foreground">Get Started</h2>
                <p className="text-body">
                  Create your account and start building your family&apos;s story collection
                </p>
              </div>
              
              {/* Fillout Widget Placeholder */}
              <div className="bg-muted/50 border-2 border-dashed border-border rounded-2xl p-8 text-center mb-8 hover-glow">
                <div className="text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                  <p className="text-lg font-medium mb-2">Fillout Registration Form</p>
                  <p className="text-small">Widget will be embedded here</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-small text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Login Card */}
          <Card className="card-elevated">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-warm/10 hover-lift">
                  <Sparkles className="h-10 w-10 text-accent-warm" />
                </div>
                <h2 className="text-3xl font-bold mb-3 text-foreground">Welcome Back</h2>
                <p className="text-body">
                  Sign in to continue your storytelling journey
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-6" aria-label="Sign in form">
                <div className="space-y-3">
                  <Label htmlFor="email-landing" className="text-base font-medium">Email Address</Label>
                  <Input
                    id="email-landing"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input h-12 text-base"
                    aria-label="Email address"
                    aria-required="true"
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={error ? "email-error-landing" : undefined}
                    disabled={loading}
                  />
                </div>

                {usePassword && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-landing" className="text-base font-medium">Password</Label>
                      <a
                        href="/auth/reset-password"
                        className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="password-landing"
                        type={showPassword ? "text" : "password"}
                        required={usePassword}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="form-input h-12 text-base pr-10"
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
                
                <Button 
                  type="submit" 
                  className="w-full btn-primary h-12 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  disabled={loading || !email || (usePassword && !password)}
                  aria-label={usePassword ? "Sign in with password" : "Send magic link"}
                >
                  {loading ? (
                    usePassword ? "Signing in..." : "Sending..."
                  ) : (
                    <>
                      {usePassword ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Sign In
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
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
                
                {error && (
                  <p 
                    id="email-error-landing"
                    className="text-small text-destructive text-center" 
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                )}
              </form>

              <div className="mt-8 text-center">
                <p className="text-small text-muted-foreground">
                  {usePassword 
                    ? "Don&apos;t have a password? Use magic link or set one up in settings."
                    : "We&apos;ll send you a secure link to sign in instantly"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <section className="mt-12 sm:mt-16 md:mt-20 text-center" aria-label="Features">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">What you&apos;ll be able to do</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-4">
            Discover the magic of AI-powered storytelling with your family&apos;s voices
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <article className="card-elevated p-6 sm:p-8 text-center hover-lift">
              <div className="mb-4 sm:mb-6 inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-foreground">Create Stories</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Generate personalized stories with your family&apos;s voices using advanced AI
              </p>
            </article>
            <article className="card-elevated p-6 sm:p-8 text-center hover-lift">
              <div className="mb-4 sm:mb-6 inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-accent-warm/10">
                <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-accent-warm" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-foreground">Clone Voices</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Record family members to create unique voice narrators that sound just like them
              </p>
            </article>
            <article className="card-elevated p-6 sm:p-8 text-center hover-lift">
              <div className="mb-4 sm:mb-6 inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
                <Headphones className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-foreground">Share & Enjoy</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Listen to your stories anytime, anywhere with your family and friends
              </p>
            </article>
          </div>
        </section>

      </div>
    </div>
  )
}
