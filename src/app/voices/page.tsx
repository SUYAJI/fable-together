"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardTutorial } from "@/components/dashboard-tutorial"
import { QuestGuidanceBar } from "@/components/quest-guidance-bar"
import { QuestCompletionModal } from "@/components/quest-completion-modal"
import { useQuestGuidance } from "@/hooks/use-quest-guidance"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Mic, Trash2, MoreVertical } from "lucide-react"
import Link from "next/link"
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
import { useRouter } from "next/navigation"
import { isDemoMode } from "@/lib/app-mode"
import { deleteDemoVoice, getDemoVoices, recordDemoAction, subscribeDemoState } from "@/lib/services/demo/state"

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
        if (isDemoMode()) {
          setVoices(getDemoVoices())
          recordDemoAction("voice_library_explored")
          return
        }
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
    if (isDemoMode()) return subscribeDemoState(() => setVoices(getDemoVoices()))
  }, [])

  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm("Are you sure you want to delete this voice? This action cannot be undone.")) {
      return
    }

    setDeletingVoiceId(voiceId)
    if (isDemoMode()) {
      deleteDemoVoice()
      setVoices(getDemoVoices())
      setDeletingVoiceId(null)
      toast({ title: "Demo Voice deleted", description: "If it was selected, Warm Storyteller is active again." })
      return
    }
    
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
        <main id="main-content" className="flex-1 overflow-y-auto bg-background" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow mb-3">Voice Library</p>
                <h1 className="text-4xl sm:text-5xl">Who should read tonight?</h1>
                <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
                  Preview each voice in any of the five languages. The one you pick on a story is remembered for the
                  next one.
                </p>
              </div>
              <Button asChild size="lg" className="w-fit gap-2">
                <Link href="/voices/clone">
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  Clone a voice
                </Link>
              </Button>
            </div>

            {/* Voice Cards - ElevenLabs Style */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading voices...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">{error}</p>
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
                  const tagString = voice.tags?.join(" · ") || ""

                  return (
                    <div
                      key={voice.id}
                      id={`voice-${voice.id}`}
                      className="flex flex-col rounded-2xl"
                    >
                      <Card
                        className="glass-card card-interactive relative overflow-hidden rounded-2xl h-full flex-1 flex flex-col py-0"
                      >
                        <CardContent className="p-5 flex flex-col h-full flex-1">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-lg"
                                aria-hidden="true"
                              >
                                {voice.name.charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <h2 className="truncate font-sans text-base font-semibold tracking-normal">
                                  {voice.name}
                                </h2>
                                {tagString && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {tagString}
                                    {voice.is_cloned ? " · Cloned" : ""}
                                  </p>
                                )}
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
                          <p className="text-sm mb-5 leading-relaxed text-muted-foreground line-clamp-3">
                            {voice.description}
                          </p>

                          {/* Language Preview with Dropdown and Waveform */}
                          <div className="mt-auto">
                            <VoiceCardPreview 
                              voiceId={voice.id}
                              voiceName={voice.name}
                            />
                          </div>
                        </CardContent>
                      </Card>
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
