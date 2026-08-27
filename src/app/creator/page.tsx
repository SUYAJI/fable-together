"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Headphones, Languages, Mic, Plus, Sparkles, X } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"

interface FAQItem {
  id: string
  question: string
  answer: string
}

const useCases = [
  {
    id: "stories",
    title: "Story Library",
    description: "Browse three illustrated sample stories and open any title for a closer look.",
    icon: BookOpen,
  },
  {
    id: "voices",
    title: "Voice Library",
    description: "Preview six narration styles and choose a favorite for the story player.",
    icon: Mic,
  },
  {
    id: "demo-voice",
    title: "Demo Voice",
    description: "Create a simulated voice that appears throughout the library without storing a recording.",
    icon: Sparkles,
  },
  {
    id: "languages",
    title: "Stored Translations",
    description: "Switch among English, Spanish, French, Mandarin, and Hindi story text.",
    icon: Languages,
  },
  {
    id: "quests",
    title: "Quests and Credits",
    description: "Follow four short quests and see the fictional credit balance update as you explore.",
    icon: Headphones,
  },
]

const faqs: FAQItem[] = [
  {
    id: "stories",
    question: "How do I listen to a story?",
    answer:
      "Open a story from the dashboard or Story Library, choose a voice and language, then select Narrate Story. Playback uses the speech voices available in your browser or operating system.",
  },
  {
    id: "voices",
    question: "What voices are available?",
    answer:
      "The library starts with six fictional narration profiles. Previewing or selecting one changes the voice used for story playback.",
  },
  {
    id: "demo-voice",
    question: "Does Create Demo Voice record or clone me?",
    answer:
      "No. The showcase simulates the product flow and creates a named Demo Voice for use across the interface. No recording is uploaded or retained.",
  },
  {
    id: "translations",
    question: "Where do the translations come from?",
    answer:
      "Each sample story includes stored English, Spanish, French, Mandarin, and Hindi text. Changing the language does not contact a translation service.",
  },
  {
    id: "credits",
    question: "How do credits work in the demo?",
    answer:
      "Fable Explorer begins with 150 fictional credits. Each of the four showcase quests grants its listed reward once.",
  },
  {
    id: "search",
    question: "What can I search for?",
    answer:
      "Use the header search to find any sample story, fixture voice, or the Demo Voice you create.",
  },
  {
    id: "persistence",
    question: "Will my progress still be here after a refresh?",
    answer:
      "Yes. Profile changes, quest progress, preferences, notifications, and the Demo Voice are saved in this browser.",
  },
  {
    id: "reset",
    question: "How do I start over?",
    answer:
      "Open Settings and choose Reset Demo State. This restores Fable Explorer, 150 credits, six voices, four incomplete quests, and one unread notification.",
  },
]

const quickLinks = [
  { href: "/stories", label: "Browse Story Library", icon: BookOpen },
  { href: "/voices", label: "Explore Voice Library", icon: Mic },
  { href: "/voices/clone", label: "Create Demo Voice", icon: Sparkles },
  { href: "/quests", label: "View Quests", icon: Headphones },
]

export default function FAQPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto dark:bg-[#1a1a1a]"
          role="main"
          tabIndex={-1}
        >
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
            <div className="mb-10 sm:mb-12">
              <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">
                Demo Guide
              </div>
              <h1 className="mb-4 max-w-4xl text-3xl font-bold sm:text-4xl md:text-5xl">
                Explore the Fable Together experience
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Start with a story, try a few narrators, and follow the quests for a short tour of the
                original product experience.
              </p>
            </div>

            <div className="mb-14 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:gap-12">
              <section className="space-y-7" aria-label="Demo features">
                {useCases.map(({ id, title, description, icon: Icon }) => (
                  <div key={id} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{title}</h2>
                      <p className="mt-1 leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </section>

              <aside className="lg:sticky lg:top-8 lg:self-start">
                <Card className="glass-card border border-border/50">
                  <CardContent className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
                    <div className="space-y-2">
                      {quickLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                        >
                          <Icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                          <span className="font-medium">{label}</span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>

            <section className="border-t pt-10" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="mb-6 text-3xl font-bold sm:text-4xl">
                Frequently asked questions
              </h2>
              <div>
                {faqs.map((faq, index) => {
                  const isExpanded = expandedFAQ === faq.id
                  const answerId = `faq-answer-${faq.id}`

                  return (
                    <div key={faq.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedFAQ(isExpanded ? null : faq.id)}
                        className="group flex w-full items-center justify-between py-6 text-left transition-colors hover:bg-muted/50"
                        aria-expanded={isExpanded}
                        aria-controls={answerId}
                      >
                        <span className="pr-8 text-lg font-medium transition-colors group-hover:text-primary">
                          {faq.question}
                        </span>
                        {isExpanded ? (
                          <X className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        ) : (
                          <Plus className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      {isExpanded && (
                        <div id={answerId} className="max-w-4xl pb-6 pr-12 leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </div>
                      )}
                      {index < faqs.length - 1 && <div className="border-b border-dashed border-border" />}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
