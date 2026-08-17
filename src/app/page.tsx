/**
 * Home Page Component
 * 
 * Landing page for Fable Together with:
 * - Hero section with value proposition
 * - Authentication toggle (sign in / register)
 * - Mobile-responsive navigation
 * - Automatic redirect for authenticated users
 * - Magic link authentication handling
 * - Intersection Observer animations
 * 
 * Fully responsive with mobile-first design approach.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Mic, ArrowRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { AuthToggleForm } from "@/components/auth/auth-toggle-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { getClientServices } from "@/lib/services/client"
import { isDemoMode } from "@/lib/app-mode"
import { HomePageStructuredData } from "./page-metadata"

/**
 * Home page component - landing page for unauthenticated users
 * 
 * Handles:
 * - Authentication state checking
 * - Magic link redirects
 * - Mobile menu toggle
 * - Fade-in animations
 */
export default function HomePage() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // Check for auth code in URL (from magic link) and redirect to callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    
    if (code) {
      // Keep loading state while redirecting to callback
      // Redirect to auth callback with the code
      router.replace(`/auth/callback?code=${code}`)
      return
    }
  }, [router])

  // Check if user is authenticated and redirect to dashboard
  useEffect(() => {
    async function checkAuth() {
      if (isDemoMode()) {
        setIsCheckingAuth(false)
        return
      }

      const user = await getClientServices().auth.getCurrentUser()
      
      if (user) {
        // User is authenticated, redirect to dashboard
        router.replace("/dashboard")
      } else {
        setIsCheckingAuth(false)
      }
    }
    
    // Only check auth if there's no code in the URL
    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.get("code")) {
      checkAuth()
    } else {
      // If there's a code, keep loading state (will redirect to callback)
      setIsCheckingAuth(true)
    }
  }, [router])

  useEffect(() => {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("content-fade-in")
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    const elements = [heroRef.current, cardsRef.current].filter(Boolean)
    elements.forEach((el) => el && observer.observe(el))

    return () => {
      elements.forEach((el) => el && observer.unobserve(el))
    }
  }, [])

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <HomePageStructuredData />
      <div className="flex flex-col h-screen bg-warm-gradient">
      {/* Header */}
      <header className="app-header z-40 flex-shrink-0" role="banner">
        <nav className="content-container flex items-center justify-between h-16 px-6 md:px-8" aria-label="Main navigation">
          {/* Logo - Text Only */}
          <div className="flex items-center gap-2">
            <Link 
              href="/" 
              className="text-xl font-semibold text-primary hover:opacity-80 transition-opacity"
              aria-label="Fable Together - Home"
            >
              Fable Together
            </Link>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/50 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50 font-semibold">
              BETA
            </Badge>
          </div>


          {/* Right Side - Theme Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background">
            <div className="content-container py-4 space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="content-container flex-1 pt-4 sm:pt-6 md:pt-8 pb-8 sm:pb-12 md:pb-16 min-h-0 overflow-y-auto" role="main" tabIndex={-1}>
        <div className="flex flex-col min-h-full justify-between gap-4">
          {/* Hero Section */}
          <section
            ref={heroRef}
            className="text-center"
            aria-labelledby="hero-heading"
          >
            <h1
              id="hero-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-foreground leading-tight"
            >
              Create Magical Stories with Your Family
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Transform your family&apos;s voices into enchanting narrators. Create personalized stories that bring your loved ones&apos; voices to life with AI-powered storytelling. Generate personalized stories with your family&apos;s voices using advanced AI. Record family members to create unique voice narrators that sound just like them. Listen to your stories anytime, anywhere with your family and friends.
            </p>
            {isDemoMode() && (
              <Button asChild size="lg" className="mt-6 gap-2">
                <Link href="/dashboard">
                  Explore Demo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </section>

          {/* Auth Section - Register/Sign In Toggle */}
          <section
            ref={cardsRef}
            className="max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 flex-shrink-0"
            aria-labelledby="auth-section-heading"
          >
            <h2 id="auth-section-heading" className="sr-only">
              Register or Sign In
            </h2>

            <AuthToggleForm />
          </section>
        </div>
      </main>

      </div>
    </>
  )
}
