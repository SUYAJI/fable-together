"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Headphones } from "lucide-react"
import { AuthToggleForm } from "@/components/auth/auth-toggle-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { FableMark } from "@/components/fable-mark"
import { CloudBank } from "@/components/cloud-bank"
import { Button } from "@/components/ui/button"
import { getClientServices } from "@/lib/services/client"
import { isDemoMode } from "@/lib/app-mode"
import { LANGUAGE_DATA, SUPPORTED_LANGUAGES } from "@/lib/language-codes"
import { HomePageStructuredData } from "./page-metadata"

const FEATURED_STORY_ID = 3

const familyVoices = [
  { name: "Grandma", avatar: "/grandma-avatar.jpg" },
  { name: "Grandpa", avatar: "/grandpa-avatar.jpg" },
  { name: "Mom", avatar: "/mom-avatar.jpg" },
  { name: "Dad", avatar: "/dad-avatar.jpg" },
  { name: "Aunt Jenni", avatar: "/aunt-jenni-avatar.jpg" },
]

export default function HomePage() {
  const router = useRouter()
  const demoMode = isDemoMode()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

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

  if (isCheckingAuth) {
    return (
      <div className="night-band flex h-screen items-center justify-center">
        <FableMark className="opacity-70" />
      </div>
    )
  }

  return (
    <>
      <HomePageStructuredData />
      <div className="flex min-h-screen flex-col bg-background">
        {/* Hero: moonlit night band */}
        <section className="night-band relative isolate overflow-hidden" aria-labelledby="hero-heading">
          <Image
            src="/moonbeam.jpg"
            alt=""
            fill
            priority
            className="-z-20 object-cover object-[30%_30%] opacity-55"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_25%_20%,transparent_0%,var(--night)_70%)]"
            aria-hidden="true"
          />
          {/* Night theme: fade into the page instead of the cloud edge */}
          <div
            className="absolute inset-x-0 bottom-0 -z-10 hidden h-48 bg-[linear-gradient(to_bottom,transparent,var(--background))] dark:block"
            aria-hidden="true"
          />

          <header className="relative z-10" role="banner">
            <nav
              className="content-container flex h-16 items-center justify-between px-6 md:px-8"
              aria-label="Main navigation"
            >
              <Link href="/" aria-label="Fable Together home" className="text-white">
                <FableMark />
              </Link>
              <div className="flex items-center gap-3">
                {demoMode && (
                  <span className="hidden rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 sm:inline">
                    Interactive demo
                  </span>
                )}
                <ThemeToggle />
              </div>
            </nav>
          </header>

          <div className="content-container relative z-10 px-6 pb-40 pt-20 sm:pt-28 md:px-8 md:pb-48">
            <div className="max-w-2xl animate-fade-in-up">
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                Stories, voices and languages for families
              </p>
              <h1 id="hero-heading" className="text-5xl leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                Empower your children through <em className="italic text-[var(--moon)]">storytelling.</em>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
                Pick an illustrated story, choose who reads it, a narrator or a voice from your own family,
                and listen together in English, Spanish, French, Chinese or Hindi.
              </p>

              {demoMode && (
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gap-2 bg-[var(--moon)] px-6 text-[var(--night)] hover:bg-white"
                    onClick={() => router.push(`/stories?story=${FEATURED_STORY_ID}`)}
                  >
                    <Headphones className="h-4 w-4" aria-hidden="true" />
                    Listen to a story
                  </Button>
                  <Button asChild size="lg" variant="ghost" className="gap-2 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/dashboard">
                      Explore the app
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              )}
              {demoMode && (
                <p className="mt-4 text-sm text-white/50">
                  No account needed. Your progress stays in this browser.
                </p>
              )}
            </div>
          </div>
        </section>
        <CloudBank className="dark:hidden" />

        <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
          {/* Three ideas from the original site */}
          <div className="content-container space-y-24 px-6 py-16 sm:py-20 md:px-8">
            <section className="grid grid-cols-1 items-center gap-10 md:grid-cols-2" aria-labelledby="keep-heading">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-night">
                <Image
                  src="/enchanted-forest-story.jpg"
                  alt="Illustration from The Enchanted Forest: a girl walking toward a glowing doorway under old trees"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div>
                <p className="eyebrow mb-3">Stories</p>
                <h2 id="keep-heading" className="text-4xl sm:text-5xl">
                  Share the stories you want them to keep.
                </h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
                  Each story is a short illustrated tale meant to be read aloud, on the page or by a narrator
                  you choose.
                </p>
                {demoMode && (
                  <Button asChild variant="outline" className="mt-6">
                    <Link href="/stories">Open the story library</Link>
                  </Button>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 items-center gap-10 md:grid-cols-2" aria-labelledby="language-heading">
              <div className="md:order-2">
                <div className="flex flex-wrap gap-3" aria-label="Narration languages">
                  {SUPPORTED_LANGUAGES.map((code) => {
                    const language = LANGUAGE_DATA[code]
                    return (
                      <span
                        key={code}
                        lang={code}
                        className="rounded-full border bg-card px-5 py-3 font-serif text-2xl sm:text-3xl"
                      >
                        {language?.nativeName ?? language?.name ?? code}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="md:order-1">
                <p className="eyebrow mb-3">Languages</p>
                <h2 id="language-heading" className="text-4xl sm:text-5xl">
                  Bridge cultures through language and story.
                </h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
                  Switch the language and the page and the narration change together, so a grandparent&apos;s
                  language can sit next to the one a child hears at school.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 items-center gap-10 md:grid-cols-2" aria-labelledby="voice-heading">
              <div className="rounded-3xl border bg-card p-6 sm:p-8">
                <ul className="space-y-3" aria-label="Example family voices">
                  {familyVoices.map((voice, index) => (
                    <li key={voice.name} className="flex items-center gap-4">
                      <Image
                        src={voice.avatar}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <span className="flex-1 font-medium">{voice.name}</span>
                      <span className="flex h-6 items-end gap-[3px]" aria-hidden="true">
                        {[5, 12, 8, 16, 10, 6, 14, 9].map((height, bar) => (
                          <span
                            key={bar}
                            className={index === 0 ? "w-[3px] rounded-full bg-lantern" : "w-[3px] rounded-full bg-border"}
                            style={{ height: `${height + ((index * 3 + bar) % 5)}px` }}
                          />
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3">Voices</p>
                <h2 id="voice-heading" className="text-4xl sm:text-5xl">
                  Clone your voice. Star in the story.
                </h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
                  Record a short sample and your voice joins the family voice library, ready to read any story,
                  even when you are not in the room.
                </p>
                {demoMode && (
                  <Button asChild variant="outline" className="mt-6">
                    <Link href="/voices/clone">Try voice cloning</Link>
                  </Button>
                )}
              </div>
            </section>
          </div>

          {demoMode ? (
            <section className="border-t" aria-labelledby="demo-heading">
              <div className="content-container grid gap-8 px-6 py-14 md:grid-cols-[1fr_1.2fr] md:px-8">
                <div>
                  <p className="eyebrow mb-3">About this demo</p>
                  <h2 id="demo-heading" className="text-3xl">
                    A working reconstruction of Fable Together.
                  </h2>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    The pages, flows and components follow the original product. Production services are
                    replaced with local behaviour: narration uses your browser&apos;s speech voices, voice cloning
                    is simulated, and translations are stored with each story.
                  </p>
                  <p>Accounts and activity are fictional. Nothing you do here is sent anywhere.</p>
                  <Button asChild className="mt-3 gap-2">
                    <Link href="/dashboard">
                      Explore the app
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <section className="content-container mb-12 px-6 md:px-8" aria-labelledby="auth-section-heading">
              <h2 id="auth-section-heading" className="sr-only">
                Register or sign in
              </h2>
              <AuthToggleForm />
            </section>
          )}
        </main>

        <footer className="night-band" role="contentinfo">
          <div className="content-container flex flex-col gap-2 px-6 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <FableMark className="text-white" />
            <p>© 2025 Fable Together</p>
          </div>
        </footer>
      </div>
    </>
  )
}
