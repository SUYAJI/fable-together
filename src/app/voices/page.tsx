/**
 * Voices Page Component
 * 
 * Voice Library page displaying available voices with:
 * - Preset voices (6 curated voices)
 * - User's cloned voices
 * - Voice preview functionality
 * - Voice management (delete, update)
 * - Responsive grid layout
 * 
 * Features:
 * - Mobile-responsive voice cards
 * - Voice preview in multiple languages
 * - Quest integration for voice cloning
 * - Voice filtering and organization
 */

"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardTutorial } from "@/components/dashboard-tutorial"
import { QuestGuidanceBar } from "@/components/quest-guidance-bar"
import { QuestCompletionModal } from "@/components/quest-completion-modal"
import { useQuestGuidance } from "@/hooks/use-quest-guidance"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Lightbulb, CheckCircle2, Trash2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { VoiceCardPreview } from "@/components/voice-card-preview"
import { filterCuratedVoices } from "@/lib/voice-filters"
import { getVoiceBorderGradient } from "@/lib/voice-colors"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

/**
 * Voice interface matching database schema
 */
interface Voice {
  id: string;
  name: string;
  description: string;
  category: string;
  accent: string;
  age: string;
  gender: string;
  use_case: string;
  is_preset: boolean;
  is_cloned: boolean;
  provider: string;
  created_at: string | null;
  tags?: string[];
  sample_count?: number;
}

export default function VoicesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionData, setCompletionData] = useState<{
    creditsEarned: number
    questTitle: string
    taskTitle: string
    nextTask?: { title: string; route: string } | null
  } | null>(null)
  const [deletingVoiceId, setDeletingVoiceId] = useState<string | null>(null)

  const { currentTask, completeTask } = useQuestGuidance()

  const handleTaskComplete = async () => {
    if (!currentTask) return

    const result = await completeTask()
    
    // Show completion modal if task was completed or quest was completed
    if (result.completed || result.questCompleted) {
      // Determine next task (only if quest is not fully completed)
      const nextTask = !result.questCompleted && currentTask.taskNumber < currentTask.totalTasks
        ? {
            title: `Task ${currentTask.taskNumber + 1}`,
            route: currentTask.route,
          }
        : null

      setCompletionData({
        creditsEarned: result.creditsAwarded || 0,
        questTitle: currentTask.questTitle,
        taskTitle: currentTask.title,
        nextTask,
      })
      setShowCompletionModal(true)
    }
  }

  const handleNextTask = () => {
    if (completionData?.nextTask) {
      router.push(completionData.nextTask.route)
    }
    setShowCompletionModal(false)
  }
  
  // Fetch voices from API
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/voices")
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || `HTTP ${response.status}: Failed to fetch voices`
          const errorDetails = errorData.details ? ` (${errorData.details})` : ''
          throw new Error(`${errorMessage}${errorDetails}`)
        }
        
        const data = await response.json()
        // Get all voices (curated + cloned)
        const allVoices = data.voices || []
        
        // Separate preset and cloned voices
        const presetVoices = allVoices.filter((v: Voice) => v.is_preset === true)
        const clonedVoices = allVoices.filter((v: Voice) => v.is_cloned === true)
        
        // Get 6 curated preset voices
        const curatedPresetVoices = filterCuratedVoices(presetVoices)
        
        // Manually assign tags to the 6 curated voices:
        // 2 Family, 2 Educator, 2 Narrator
        const taggedCuratedVoices = curatedPresetVoices.map((voice, index) => {
          let tags: string[] = [];
          if (index < 2) {
            // First 2 voices: Family
            tags = ['Family'];
          } else if (index < 4) {
            // Next 2 voices: Educator
            tags = ['Educator'];
          } else {
            // Last voices: Narrator
            tags = ['Narrator'];
          }
          return { ...voice, tags };
        });
        
        // Combine curated preset voices + all cloned voices
        const libraryVoices = [...taggedCuratedVoices, ...clonedVoices]
        
        setVoices(libraryVoices)
      } catch (err) {
        console.error("Error fetching voices:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch voices")
      } finally {
        setLoading(false)
      }
    }

    fetchVoices()
  }, [])

  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm("Are you sure you want to delete this voice? This action cannot be undone.")) {
      return
    }

    setDeletingVoiceId(voiceId)
    
    // Optimistically remove from UI immediately
    const previousVoices = voices
    setVoices(voices.filter(v => v.id !== voiceId))
    
    try {
      const response = await fetch(`/api/voices/delete?voiceId=${voiceId}`, {
        method: "DELETE",
        cache: "no-store", // Prevent caching
      })

      const data = await response.json()

      // Handle 404 as success (voice already deleted)
      if (response.status === 404 || (response.ok && data.success)) {
        // Voice deleted successfully or already deleted
        // Refetch voices with cache busting to ensure fresh data
        const voicesResponse = await fetch("/api/voices?t=" + Date.now(), {
          cache: "no-store",
        })
        
        if (voicesResponse.ok) {
          const voicesData = await voicesResponse.json()
          const allVoices = voicesData.voices || []
          
          // Separate preset and cloned voices
          const presetVoices = allVoices.filter((v: Voice) => v.is_preset === true)
          const clonedVoices = allVoices.filter((v: Voice) => v.is_cloned === true)
          
          // Get 6 curated preset voices
          const curatedPresetVoices = filterCuratedVoices(presetVoices)
          
          // Manually assign tags to the 6 curated voices
          const taggedCuratedVoices = curatedPresetVoices.map((voice, index) => {
            let tags: string[] = [];
            if (index < 2) {
              tags = ['Family'];
            } else if (index < 4) {
              tags = ['Educator'];
            } else {
              tags = ['Narrator'];
            }
            return { ...voice, tags };
          });
          
          // Combine curated preset voices + all cloned voices
          const libraryVoices = [...taggedCuratedVoices, ...clonedVoices]
          
          setVoices(libraryVoices)
        }
        
        // Invalidate sidebar cache by triggering a refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("voice-deleted"))
        }
        
        toast({
          title: "Voice deleted",
          description: "The voice has been removed from your library.",
        })
      } else {
        // Restore previous state on error
        setVoices(previousVoices)
        throw new Error(data.error || "Failed to delete voice")
      }
    } catch (err) {
      console.error("Error deleting voice:", err)
      // Restore previous state on error
      setVoices(previousVoices)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete voice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingVoiceId(null)
    }
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-12 sm:mb-16">
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                Voices
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Voice Library
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Discover and manage voices for your stories.
              </p>
            </div>

            {/* Tips for Using Voices */}
            <Card className="mb-6 sm:mb-8 glass-card border border-border/50 rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-accent-warm flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Match voices to your story&apos;s tone and preview them before narrating to ensure they match your story&apos;s mood and style.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Cards - ElevenLabs Style */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading voices...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : voices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-base">
                  No voices available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {voices.map((voice) => {
                  const borderGradient = getVoiceBorderGradient(voice.name)
                  const tagString = voice.tags?.join(" • ") || ""
                  
                  return (
                    <div
                      key={voice.id}
                      className={cn(
                        "relative rounded-2xl transition-all hover:shadow-lg flex flex-col p-[1px]",
                        `bg-gradient-to-r ${borderGradient}`
                      )}
                    >
                      <Card 
                        className="glass-card relative overflow-hidden rounded-2xl border-0 h-full flex-1 flex flex-col"
                      >
                        <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col h-full flex-1">
                          {/* Header with Title and Checkmark */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">
                                {voice.name}
                              </h3>
                              <div className="h-4 w-4 rounded-full flex items-center justify-center bg-foreground/10 flex-shrink-0">
                                <CheckCircle2 className="h-2.5 w-2.5 text-foreground/70" />
                              </div>
                            </div>
                            {voice.is_cloned && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0"
                                    disabled={deletingVoiceId === voice.id}
                                    aria-label={`More options for ${voice.name}`}
                                    aria-haspopup="true"
                                  >
                                    {deletingVoiceId === voice.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                      <MoreVertical className="h-4 w-4" aria-hidden="true" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteVoice(voice.id)}
                                    className="text-destructive focus:text-destructive"
                                    aria-label={`Delete ${voice.name}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                    Delete Voice
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-sm sm:text-base mb-4 leading-relaxed text-muted-foreground line-clamp-3">
                            {voice.description}
                          </p>

                          {/* Tags */}
                          {tagString && (
                            <p className="text-xs mb-4 text-muted-foreground/70">
                              {tagString} • HQ
                            </p>
                          )}

                          {/* Language Preview with Dropdown and Waveform */}
                          <div className="mt-auto">
                            <VoiceCardPreview 
                              voiceId={voice.id}
                              voiceName={voice.name}
                            />
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Bottom Tab with Gradient - Larger */}
                      <div 
                        className={cn(
                          "h-3 rounded-b-2xl -mt-[1px]",
                          `bg-gradient-to-r ${borderGradient}`
                        )}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
        <DashboardTutorial />
      </div>
      {currentTask && (
        <QuestGuidanceBar
          task={currentTask}
          onComplete={handleTaskComplete}
        />
      )}
      {completionData && (
        <QuestCompletionModal
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
          creditsEarned={completionData.creditsEarned}
          questTitle={completionData.questTitle}
          taskTitle={completionData.taskTitle}
          nextTask={completionData.nextTask}
          onNextTask={handleNextTask}
        />
      )}
    </div>
  )
}
