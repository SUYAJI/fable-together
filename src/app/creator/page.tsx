"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Video,
  Languages,
  Headphones,
  Plus,
  X,
  Mic
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface FAQItem {
  id: string
  question: string
  answer: string
}

const useCases = [
  {
    id: "stories",
    title: "STORY LIBRARY",
    description: "Browse and explore our collection of example stories. Each story can be narrated with any voice from your library in multiple languages. Perfect for bedtime stories, family time, or language learning.",
    icon: <BookOpen className="h-6 w-6" />
  },
  {
    id: "voices",
    title: "VOICE LIBRARY",
    description: "Access curated preset voices or use your own cloned family voices. Preview voices in different languages before using them in your stories. Each voice has unique characteristics perfect for different story types.",
    icon: <Mic className="h-6 w-6" />
  },
  {
    id: "clone",
    title: "VOICE CLONING",
    description: "Create digital copies of family members&apos; voices by uploading audio recordings or recording directly in the app. Use these cloned voices to narrate stories, making them feel more personal and familiar.",
    icon: <Video className="h-6 w-6" />
  },
  {
    id: "multilingual",
    title: "MULTILINGUAL NARRATION",
    description: "Narrate any story in multiple languages including English, Spanish, Chinese (Mandarin), Hindi, and French. The same voice can speak different languages, perfect for language learning or multilingual families.",
    icon: <Languages className="h-6 w-6" />
  },
  {
    id: "quests",
    title: "QUESTS & CREDITS",
    description: "Complete quests to earn credits that you can use to narrate stories and clone voices. Track your progress and earn rewards as you explore the platform and create content.",
    icon: <Headphones className="h-6 w-6" />
  }
]

const faqs: FAQItem[] = [
  {
    id: "how-stories-work",
    question: "How do I use the Story Library?",
    answer: "The Story Library contains example stories you can explore. To narrate a story, click on it to open the story detail view. Then select a voice from your Voice Library, choose a language, adjust the narration speed if desired, and click 'Narrate Story'. The audio will be generated and you can play it, download it, or save it to your account."
  },
  {
    id: "how-voices-work",
    question: "What voices are available in my Voice Library?",
    answer: "Your Voice Library includes curated preset voices (currently 6 voices available) that are perfect for different types of stories - some are great for family stories, others for educational content, and some for narration. You can also add your own cloned family voices. Each voice can be previewed in different languages before you use it in a story."
  },
  {
    id: "how-clone-voice",
    question: "How do I clone a family member's voice?",
    answer: "Go to 'Clone a Voice' in the sidebar. Enter a name for the voice (like 'Grandma Sarah' or 'Uncle Mike'). Then either upload an audio file (MP3, WAV, or M4A format, at least 60 seconds, max 25MB) or record directly in the app. Make sure the audio is clear, consistent, and features only one speaker. Click 'Clone Voice' and your cloned voice will be added to your Voice Library once processing is complete."
  },
  {
    id: "what-languages",
    question: "What languages are supported for story narration?",
    answer: "Currently, Fable Together supports narration in English, Spanish, Chinese (Mandarin), Hindi, and French. You can narrate any story in any of these languages using any voice from your library. The same voice will speak in the selected language, making it perfect for language learning or multilingual families."
  },
  {
    id: "how-speed-control",
    question: "Can I adjust the narration speed?",
    answer: "Yes! When narrating a story, you can adjust the speed using a slider that ranges from 0.25x (very slow) to 2.0x (very fast). This is helpful for language learning, making stories easier to follow, or speeding up longer stories."
  },
  {
    id: "how-credits-work",
    question: "How do credits work?",
    answer: "Credits are used to narrate stories and clone voices. You can earn credits by completing quests on the platform. When you complete a quest for the first time, you'll earn credits as a reward. You can check your available credits in the header next to your profile. Credits are only awarded once per quest completion."
  },
  {
    id: "how-quests-work",
    question: "What are quests and how do I complete them?",
    answer: "Quests are tasks that guide you through using Fable Together's features. They help you explore the platform and earn credits. You can view all available quests on the Quests page. Each quest has multiple tasks, and you'll earn credits when you complete a quest for the first time. You can reset quests to try them again, but you won't earn credits again after the first completion."
  },
  {
    id: "how-search",
    question: "How does the search function work?",
    answer: "The search bar in the header lets you quickly find stories and voices. It searches through your Story Library (the 3 example stories) and your Voice Library (the 6 preset voices plus any cloned voices you've added). Just type what you're looking for and select from the results."
  },
  {
    id: "how-invite-friends",
    question: "How do I invite friends to Fable Together?",
    answer: "You can invite friends through the 'Invite Friends' section in the sidebar. When friends sign up using your invitation, you'll earn 50 tokens per signup. This is a great way to share Fable Together with your family and friends while earning credits to use on the platform."
  },
  {
    id: "can-download",
    question: "Can I download the narrated audio?",
    answer: "Yes! After narrating a story, you can download the audio file. This allows you to save it locally, share it with family, or use it in other projects. The audio is generated in high quality and can be played on any device that supports MP3 files."
  },
  {
    id: "what-is-beta",
    question: "What does 'Beta' mean?",
    answer: "Fable Together is currently in beta, which means we're actively working on improving features and adding new functionality. During beta, you can explore the platform with example stories and preset voices. We're continuously improving based on user feedback, so your experience helps shape the future of the platform!"
  },
  {
    id: "how-feedback",
    question: "How can I provide feedback?",
    answer: "You can provide feedback directly from your Dashboard. Click the 'Provide Feedback' button in the welcome section to open a feedback modal. Share your thoughts, suggestions, or report any issues you encounter. We value your input and use it to improve Fable Together for everyone."
  }
]

export default function FAQPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-8 sm:mb-12 md:mb-16">
              <div className="text-xs sm:text-sm uppercase tracking-wide text-muted-foreground mb-3 sm:mb-4">
                Help & Support
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Everything you need to know about Fable Together
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
                Learn how to use stories, voices, narration, and all the features available on the platform.
              </p>
            </div>

            {/* Pricing Section */}
            <div className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                  Simple, Transparent Pricing
                </h2>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  One plan with everything you need to create and share AI-powered stories
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <Card className="glass-card border border-border/50">
                  <CardContent className="p-6 sm:p-8">
                    <div className="text-center mb-8">
                      <div className="text-4xl sm:text-5xl font-bold mb-2">$4.99</div>
                      <div className="text-muted-foreground mb-6">per month</div>
                      <Button size="lg" className="w-full sm:w-auto px-8">
                        Get Started
                      </Button>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                      <h3 className="text-lg font-semibold mb-4">What's Included</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Story Library</div>
                            <div className="text-sm text-muted-foreground">Access to example stories</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Voice Library</div>
                            <div className="text-sm text-muted-foreground">6 curated preset voices</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Voice Cloning</div>
                            <div className="text-sm text-muted-foreground">Create unlimited voice clones</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Multilingual Narration</div>
                            <div className="text-sm text-muted-foreground">5 supported languages</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Story Narration</div>
                            <div className="text-sm text-muted-foreground">Generate audio for any story</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Quests & Credits</div>
                            <div className="text-sm text-muted-foreground">Earn credits through quests</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Use Cases Section - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
              {/* Left Column - Use Cases */}
              <div className="space-y-8">
                {useCases.map((useCase) => (
                  <div key={useCase.id} className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-primary">
                        {useCase.icon}
                      </div>
                      <h2 className="text-lg font-bold uppercase tracking-wide">
                        {useCase.title}
                      </h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right Column - Quick Links */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <Card className="glass-card border border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                    
                    <div className="space-y-3">
                      <a 
                        href="/stories" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <BookOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Browse Story Library</span>
                      </a>
                      <a 
                        href="/voices" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Mic className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Explore Voice Library</span>
                      </a>
                      <a 
                        href="/voices/clone" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Video className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Clone a Voice</span>
                      </a>
                      <a 
                        href="/quests" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Headphones className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-medium">View Quests</span>
                      </a>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-muted-foreground mb-3">
                        Need more help? Check out the questions below or contact our support team.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="border-t pt-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-8">Frequently asked questions</h2>
              
              <div className="space-y-0">
                {faqs.map((faq, index) => {
                  const isExpanded = expandedFAQ === faq.id
                  
                  return (
                    <div key={faq.id}>
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full flex items-center justify-between py-6 text-left hover:bg-muted/50 transition-colors group"
                      >
                        <span className="text-lg font-medium pr-8 group-hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <X className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Plus className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="pb-6 pr-12">
                          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </div>
                        </div>
                      )}
                      
                      {index < faqs.length - 1 && (
                        <div className="border-b border-dashed border-border" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
