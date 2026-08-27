"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, BookOpen, Languages, Mic } from "lucide-react"
import { AuthToggleForm } from "@/components/auth/auth-toggle-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getClientServices } from "@/lib/services/client"
import { isDemoMode } from "@/lib/app-mode"
import { HomePageStructuredData } from "./page-metadata"

const features = [
  {
    title: "Discover stories",
    description: "Explore a small library of illustrated family stories.",
    icon: BookOpen,
  },
  {
    title: "Choose a voice",
    description: "Preview narrators or create a simulated Demo Voice.",
    icon: Mic,
  },
  {
    title: "Listen your way",
    description: "Hear stories with browser narration and stored translations.",
    icon: Languages,
  },
]

export default function HomePage() {
  const router = useRouter()
  const demoMode = isDemoMode()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")
    if (code) router.replace(`/auth/callback?code=${code}`)
  }, [router])

  useEffect(() => {
    async function checkAuth() {
      if (demoMode) {
        setIsCheckingAuth(false)
        return
      }

      const user = await getClientServices().auth.getCurrentUser()
      if (user) router.replace("/dashboard")
      else setIsCheckingAuth(false)
    }

    const hasAuthCode = new URLSearchParams(window.location.search).has("code")
    if (!hasAuthCode) checkAuth()
  }, [demoMode, router])

  useEffect(() => {
    const elements = [heroRef.current, cardsRef.current].filter(
      (element): element is HTMLDivElement => Boolean(element),
    )
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("content-fade-in")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    )

    elements.forEach((element) => observer.observe(element))
    return () => elements.forEach((element) => observer.unobserve(element))
  }, [])

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <HomePageStructuredData />
      <div className="flex min-h-screen flex-col bg-warm-gradient">
        <header className="app-header z-40 flex-shrink-0" role="banner">
          <nav
            className="content-container flex h-16 items-center justify-between px-6 md:px-8"
            aria-label="Main navigation"
          >
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-xl font-semibold text-primary transition-opacity hover:opacity-80"
                aria-label="Fable Together home"
              >
                Fable Together
              </Link>
              <Badge
                variant="outline"
                className="border-orange-500/50 bg-orange-500/10 font-semibold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
              >
                {demoMode ? "INTERACTIVE DEMO" : "BETA"}
              </Badge>
            </div>
            <ThemeToggle />
          </nav>
        </header>

        <main
          id="main-content"
          className="content-container flex flex-1 flex-col justify-center gap-8 px-6 py-10 sm:gap-10 sm:py-14 md:px-8"
          role="main"
          tabIndex={-1}
        >
          <section ref={heroRef} className="text-center" aria-labelledby="hero-heading">
            <h1
              id="hero-heading"
              className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Stories sound different when they are told together.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Fable Together paired personalized stories with familiar narration voices, making it easy
              for families to discover, listen, and share story experiences.
            </p>
            {demoMode && (
              <div className="mt-7">
                <Button asChild size="lg" className="gap-2 px-7">
                  <Link href="/dashboard">
                    Explore Demo
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="mt-3 text-sm text-muted-foreground">
                  No account required. Demo progress is saved in your browser.
                </p>
              </div>
            )}
          </section>

          <section
            ref={cardsRef}
            className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3"
            aria-label="What you can explore"
          >
            {features.map(({ title: featureTitle, description: featureDescription, icon: Icon }) => (
              <div
                key={featureTitle}
                className="glass-card rounded-xl border border-border/50 p-5 text-left sm:p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold">{featureTitle}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {featureDescription}
                </p>
              </div>
            ))}
          </section>

          {!demoMode && (
            <section
              className="mx-auto mb-8 w-full max-w-4xl sm:mb-12"
              aria-labelledby="auth-section-heading"
            >
              <h2 id="auth-section-heading" className="sr-only">
                Register or sign in
              </h2>
              <AuthToggleForm />
            </section>
          )}
        </main>
      </div>
    </>
  )
}
