"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Download, Loader2, Pause, Edit, Trash2, MoreVertical } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ELEVENLABS_LANGUAGE_MAP, LANGUAGE_NAMES, SUPPORTED_LANGUAGES, getLanguageData, getLanguageFlag } from "@/lib/language-codes"
import { filterCuratedVoices } from "@/lib/voice-filters"
import { EnhancedAudioPlayer } from "@/components/enhanced-audio-player"
import { getVoiceBorderGradient } from "@/lib/voice-colors"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { StoryPlayerModal, type PlayerStory, type PlayerNarration } from "@/components/story-player-modal"
import { createBrowserNarration, isBrowserNarrationAvailable } from "@/lib/browser-narration"
import { isDemoMode } from "@/lib/app-mode"
import { getDemoState, getDemoVoices, recordDemoAction, setDemoPreferredVoice, setDemoStoryLanguage } from "@/lib/services/demo/state"
import { getDemoStoryTranslation } from "@/lib/services/demo/story-repository"

/**
 * Voice interface for voice selection
 */
interface Voice {
  id: string
  name: string
  tags?: string[]
  description?: string
  is_preset?: boolean
  is_cloned?: boolean
}

/**
 * Audio variation from API response
 */
interface AudioVariationResponse {
  id: string
  story_id: number
  voice_id: string
  language_code: string
  audio_url: string
  speed: number
  name?: string | null
  description?: string | null
  created_at: string
}

/**
 * Saved audio variation with enriched data (voice name, language name)
 */
interface SavedAudio {
  id: string
  voiceId: string
  voiceName: string
  languageCode: string
  languageName: string
  audioUrl: string
  speed: number
  createdAt: string
  name?: string | null
  description?: string | null
}

type VoiceCategory = "all" | "family" | "educators" | "narrators"

interface StoryNarrationControlsProps {
  storyId: number
  storyText: string
  storyTitle: string
  story: PlayerStory
}

// Component for individual saved audio variation
function SavedAudioVariation({ 
  audio, 
  onUpdate, 
  onDelete 
}: { 
  audio: SavedAudio
  onUpdate: (id: string, name: string, description: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const { toast } = useToast()
  const [variationAudio, setVariationAudio] = useState<HTMLAudioElement | null>(null)
  const [isVariationPlaying, setIsVariationPlaying] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState(audio.name || "")
  const [editDescription, setEditDescription] = useState(audio.description || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (audio.audioUrl) {
      const audioEl = new Audio(audio.audioUrl)
      audioEl.onended = () => setIsVariationPlaying(false)
      audioEl.onerror = () => setIsVariationPlaying(false)
      setVariationAudio(audioEl)
      
      return () => {
        audioEl.pause()
        audioEl.src = ""
      }
    }
  }, [audio.audioUrl])

  useEffect(() => {
    setEditName(audio.name || "")
    setEditDescription(audio.description || "")
  }, [audio.name, audio.description])
  
  const handleVariationPlayPause = () => {
    if (!variationAudio) return
    if (isVariationPlaying) {
      variationAudio.pause()
      setIsVariationPlaying(false)
    } else {
      variationAudio.play()
      setIsVariationPlaying(true)
    }
  }

  const handleDownload = () => {
    if (!audio.audioUrl) return
    
    const link = document.createElement("a")
    link.href = audio.audioUrl
    const fileName = audio.name || `${audio.voiceName}-${audio.languageName}`
    link.download = `${fileName}-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSaveEdit = async () => {
    setIsUpdating(true)
    try {
      await onUpdate(audio.id, editName.trim(), editDescription.trim())
      setIsEditDialogOpen(false)
      toast({
        title: "Updated",
        description: "Audio variation updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update audio variation.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this audio variation? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(audio.id)
      toast({
        title: "Deleted",
        description: "Audio variation deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete audio variation.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const displayName = audio.name || `${audio.voiceName} - ${audio.languageName}`
  
  return (
    <>
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{displayName}</p>
              {audio.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{audio.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{audio.voiceName} • {audio.languageName} • {audio.speed.toFixed(2)}x</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {variationAudio && (
            <EnhancedAudioPlayer
              audio={variationAudio}
              audioUrl={audio.audioUrl}
              isPlaying={isVariationPlaying}
              onPlayPause={handleVariationPlayPause}
              showActions={false}
            />
          )}
        </div>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Audio Variation</DialogTitle>
            <DialogDescription>
              Update the name and description for this audio variation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter a name for this variation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter a description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating || !editName.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function StoryNarrationControls({ 
  storyId, 
  storyText, 
  storyTitle,
  story,
}: StoryNarrationControlsProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en")
  const [speed, setSpeed] = useState<number[]>([1.0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [savedAudios, setSavedAudios] = useState<SavedAudio[]>([])
  const [isLoadingVoices, setIsLoadingVoices] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [translatedText, setTranslatedText] = useState<string>(storyText)
  const [isTranslating, setIsTranslating] = useState(false)
  const [activeVoiceCategory, setActiveVoiceCategory] = useState<VoiceCategory>("all")
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null)
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null)
  const [narration, setNarration] = useState<PlayerNarration | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)

  // Fetch user's voices from their library (all voices, not just curated)
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoadingVoices(true)
        if (isDemoMode()) {
          const libraryVoices = getDemoVoices()
          setVoices(libraryVoices)
          setSelectedVoiceId(getDemoState().preferredVoiceId)
          setSelectedLanguage(getDemoState().preferences.storyLanguage)
          return
        }
        const response = await fetch("/api/voices")
        if (!response.ok) {
          throw new Error("Failed to fetch voices")
        }
        const data = await response.json()
        // Get voices from user's library (same as voice library page)
        // This includes: 6 curated preset voices + all user's cloned voices
        const allVoices = data.voices || []
        
        // Separate preset and cloned voices
        const presetVoices = allVoices.filter((v: Voice) => v.is_preset === true)
        const clonedVoices = allVoices.filter((v: Voice) => v.is_cloned === true)
        
        // Get 6 curated preset voices (same filtering as voice library)
        const curatedPresetVoices = filterCuratedVoices(presetVoices)
        
        // Manually assign tags to curated voices (same as voice library)
        const taggedCuratedVoices = curatedPresetVoices.map((voice: Voice, index: number) => {
          let tags: string[] = []
          if (index < 2) {
            tags = ['Family']
          } else if (index < 4) {
            tags = ['Educator']
          } else {
            tags = ['Narrator']
          }
          return { ...voice, tags }
        })
        
        // Combine curated preset voices + all cloned voices
        const libraryVoices = [...taggedCuratedVoices, ...clonedVoices]
        
        setVoices(libraryVoices)
        if (libraryVoices.length > 0) {
          setSelectedVoiceId(libraryVoices[0].id)
        }
      } catch (err) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching voices:", err)
        }
        setError("Failed to load voices. Please try again.")
      } finally {
        setIsLoadingVoices(false)
      }
    }

    fetchVoices()
  }, [])

  // Filter voices by category - memoized for performance
  const filteredVoices = useMemo(() => voices.filter((voice) => {
    if (activeVoiceCategory === "all") return true
    if (activeVoiceCategory === "family") {
      return voice.tags?.includes("Family") || false
    }
    if (activeVoiceCategory === "educators") {
      return voice.tags?.includes("Educator") || false
    }
    if (activeVoiceCategory === "narrators") {
      return voice.tags?.includes("Narrator") || false
    }
    return true
  }), [voices, activeVoiceCategory])

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.src = ""
      }
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
      }
    }
  }, [previewAudio, audioElement])

  // Handle audio playback for generated audio
  useEffect(() => {
    if (audioUrl) {
      // Clean up previous audio element
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
      }
      
      // Create new audio element
      const audio = new Audio(audioUrl)
      audio.onended = () => setIsPlaying(false)
      audio.onerror = () => setIsPlaying(false)
      setAudioElement(audio)
      
      return () => {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audioUrl])

  // Handle voice preview
  const handleVoicePreview = async (voiceId: string, voiceName: string) => {
    // Stop current preview if playing
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.src = ""
      setPreviewAudio(null)
    }

    // If clicking the same voice, just stop
    if (playingPreviewId === voiceId) {
      if (isBrowserNarrationAvailable()) window.speechSynthesis.cancel()
      setPlayingPreviewId(null)
      return
    }

    setPlayingPreviewId(voiceId)
    try {
      // Get preview text in selected language
      const previewTexts: Record<string, string> = {
        'en': `Hello, this is a preview of ${voiceName}`,
        'es': `Hola, esta es una vista previa de ${voiceName}`,
        'fr': `Bonjour, ceci est un aperçu de ${voiceName}`,
        'zh': `你好，这是 ${voiceName} 的预览`,
        'hi': `नमस्ते, यह ${voiceName} का पूर्वावलोकन है`,
      }
      const previewText = previewTexts[selectedLanguage] || previewTexts['en']
      if (isDemoMode()) {
        const utterance = createBrowserNarration(previewText, 1, voiceId, selectedLanguage)
        if (!utterance) throw new Error("Browser narration is unavailable")
        utterance.onend = () => setPlayingPreviewId(null)
        utterance.onerror = () => setPlayingPreviewId(null)
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
        recordDemoAction("voice_previewed")
        return
      }
      
      const response = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          text: previewText,
          language: ELEVENLABS_LANGUAGE_MAP[selectedLanguage] || "en",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate preview")
      }

      if (response.headers.get("content-type")?.includes("application/json")) {
        const preview = await response.json()
        if (preview.playback === "browser-speech") {
          const utterance = createBrowserNarration(preview.text, 1)
          if (!utterance) throw new Error("Browser narration is unavailable")
          utterance.onend = () => setPlayingPreviewId(null)
          utterance.onerror = () => setPlayingPreviewId(null)
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
          return
        }
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audioElement = new Audio(audioUrl)
      
      audioElement.onended = () => {
        setPlayingPreviewId(null)
        setPreviewAudio(null)
        URL.revokeObjectURL(audioUrl)
      }
      
      audioElement.onerror = () => {
        setPlayingPreviewId(null)
        setPreviewAudio(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audioElement.play()
      setPreviewAudio(audioElement)
    } catch (err) {
      console.error("Preview error:", err)
      setPlayingPreviewId(null)
      setPreviewAudio(null)
    }
  }

  // Reset preview when language changes
  useEffect(() => {
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.src = ""
      setPreviewAudio(null)
    }
    setPlayingPreviewId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  const fetchSavedAudios = useCallback(async () => {
    if (isDemoMode()) {
      setSavedAudios([])
      return
    }
    try {
      const response = await fetch(`/api/stories/audio/variations?storyId=${storyId}`)
      if (response.ok) {
        const data = await response.json()
        const variations = data.variations || []
        
        // Fetch voice names for each variation
        const voicesResponse = await fetch("/api/voices")
        if (voicesResponse.ok) {
          const voicesData = await voicesResponse.json()
          const allVoices = voicesData.voices || []
          
          const variationsWithVoiceNames = variations.map((variation: AudioVariationResponse) => {
            const voice = allVoices.find((v: Voice) => v.id === variation.voice_id)
            return {
              id: variation.id,
              voiceId: variation.voice_id,
              voiceName: voice?.name || "Unknown Voice",
              languageCode: variation.language_code,
              languageName: LANGUAGE_NAMES[variation.language_code] || variation.language_code,
              audioUrl: variation.audio_url,
              speed: variation.speed,
              createdAt: variation.created_at,
              name: variation.name || null,
              description: variation.description || null,
            }
          })
          
          setSavedAudios(variationsWithVoiceNames)
        } else {
          setSavedAudios(variations)
        }
      } else if (response.status === 500) {
        setSavedAudios([])
      }
    } catch {
      setSavedAudios([])
    }
  }, [storyId])

  // Load saved audios for this story
  useEffect(() => {
    fetchSavedAudios()
  }, [fetchSavedAudios])

  // Translate text when language changes
  useEffect(() => {
    const translateText = async () => {
      if (isDemoMode()) {
        setDemoStoryLanguage(selectedLanguage)
        setTranslatedText(getDemoStoryTranslation(storyId, selectedLanguage) || storyText)
        setIsTranslating(false)
        setError(null)
        return
      }

      // If English, use original text
      if (selectedLanguage === "en") {
        setTranslatedText(storyText)
        return
      }

      // Translate to selected language
      setIsTranslating(true)
      setError(null)
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: storyText,
            targetLanguage: selectedLanguage,
            sourceLanguage: "en",
          }),
        })

        const data = await response.json()
        if (data.success && data.translatedText) {
          setTranslatedText(data.translatedText)
        } else {
          // Fallback to English if translation fails
          setTranslatedText(storyText)
          setError("Translation unavailable. Showing English text.")
        }
      } catch (err) {
        console.error("Translation error:", err)
        // Fallback to English
        setTranslatedText(storyText)
        setError("Translation failed. Showing English text.")
      } finally {
        setIsTranslating(false)
      }
    }

    translateText()
  }, [selectedLanguage, storyId, storyText])

  const handleNarrate = async () => {
    if (!selectedVoiceId) {
      setError("Please select a voice")
      return
    }

    // Wait for translation if still translating
    if (isTranslating) {
      setError("Please wait for translation to complete")
      return
    }

    setIsGenerating(true)
    setError(null)
    try {
      if (isDemoMode()) {
        const selectedVoice = voices.find((voice) => voice.id === selectedVoiceId)
        if (!selectedVoice) throw new Error("The selected demo voice is unavailable")
        const result: PlayerNarration = {
          playback: "browser-speech",
          text: translatedText,
          voiceName: selectedVoice.name,
          voiceId: selectedVoice.id,
          language: selectedLanguage,
          speed: speed[0],
          disclosure: "This demo uses browser speech. No audio or recording is sent or retained.",
        }
        setNarration(result)
        setAudioUrl(null)
        setIsPlaying(false)
        setIsPlayerOpen(true)
        recordDemoAction("narration_created")
        return
      }

      const response = await fetch("/api/stories/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exampleStoryId: storyId,
          voiceId: selectedVoiceId,
          language: ELEVENLABS_LANGUAGE_MAP[selectedLanguage] || "en",
          speed: speed[0],
          translatedText: translatedText, // Send translated text
        }),
      })

      const data = await response.json()
      if (data.success && data.narration) {
        const result = data.narration as PlayerNarration
        setNarration(result)
        setAudioUrl(result.audioUrl || null)
        setIsPlaying(false)
        if (audioElement) {
          audioElement.pause()
          audioElement.src = ""
        }
        setAudioElement(null)
        setIsPlayerOpen(true)
      } else {
        setError(data.error || "Failed to generate audio")
      }
    } catch (error) {
      console.error("Narration failed:", error)
      setError("Failed to generate audio. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlayPause = () => {
    if (!audioElement) return
    
    if (isPlaying) {
      audioElement.pause()
      setIsPlaying(false)
    } else {
      audioElement.play()
      setIsPlaying(true)
    }
  }

  const handleDownload = () => {
    if (!audioUrl) return
    
    const link = document.createElement("a")
    link.href = audioUrl
    const languageName = LANGUAGE_NAMES[selectedLanguage] || selectedLanguage
    link.download = `${storyTitle}-${languageName}-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSave = async () => {
    if (!audioUrl || !selectedVoiceId) return
    
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/stories/audio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          voiceId: selectedVoiceId,
          languageCode: selectedLanguage,
          audioUrl,
          speed: speed[0],
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh saved audios list
        await fetchSavedAudios()
      } else {
        setError(data.error || "Failed to save audio")
      }
    } catch (error) {
      console.error("Save failed:", error)
      setError("Failed to save audio. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }


  const handleUpdateVariation = async (id: string, name: string, description: string) => {
    const response = await fetch("/api/stories/audio/variations/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, description }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to update audio variation")
    }

    // Refresh saved audios list
    await fetchSavedAudios()
  }

  const handleDeleteVariation = async (id: string) => {
    const response = await fetch(`/api/stories/audio/variations/delete?id=${id}`, {
      method: "DELETE",
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete audio variation")
    }

    // Refresh saved audios list
    await fetchSavedAudios()
  }

  // Helper function to get voice type label
  const getVoiceTypeLabel = (voice: Voice): string => {
    if (voice.tags && voice.tags.length > 0) {
      const tag = voice.tags[0]
      if (tag === "Family") return "Family voice"
      if (tag === "Educator") return "Educator voice"
      if (tag === "Narrator") return "Narrator voice"
      return tag
    }
    if (voice.is_cloned) return "Cloned voice"
    return "Voice"
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header with Typography Hierarchy */}
      <div className="mb-6 sm:mb-8">
        <div className="text-xs sm:text-sm uppercase tracking-wide text-muted-foreground mb-3 sm:mb-4">
          Narration
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
          Narrate Your Story
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
          Select a voice, language, and speed to generate audio narration for your story
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <StoryPlayerModal
        story={story}
        narration={narration}
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
      />

      {/* Audio Player with Waveform - Always Visible */}
      <Card className="glass-card border border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Audio</h3>
            </div>
            
            {audioUrl && audioElement ? (
              <EnhancedAudioPlayer
                audio={audioElement}
                audioUrl={audioUrl}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onDownload={handleDownload}
                onSave={handleSave}
                isSaving={isSaving}
              />
            ) : narration?.playback === "browser-speech" ? (
              <div className="space-y-3 rounded-xl border border-dashed border-border/50 bg-muted/30 p-6 text-center">
                <p className="text-sm font-medium">{narration.disclosure || "Browser narration preview"}</p>
                <p className="text-sm text-muted-foreground">Ready with {narration.voiceName}. Playback uses your browser&apos;s available system voice.</p>
                <Button onClick={() => setIsPlayerOpen(true)} variant="outline" aria-label="Open story player">
                  Open Story Player
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 bg-muted/30 rounded-xl border border-dashed border-border/50">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Generate audio narration to see it here
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Story Text Display - Right Under Generated Audio */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Story Text</h3>
        <div 
          className="bg-muted/50 p-6 sm:p-8 rounded-xl border border-border/50 min-h-[300px] max-h-[500px] overflow-y-auto" 
          role="region" 
          aria-label="Story text"
        >
          {isTranslating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Translating to {getLanguageData(selectedLanguage)?.name || LANGUAGE_NAMES[selectedLanguage]}...</span>
            </div>
          ) : (
            <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-foreground">
              {translatedText}
            </p>
          )}
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Language</label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select narration language">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const langData = getLanguageData(lang)
            const flag = getLanguageFlag(lang)
            const name = langData?.name || LANGUAGE_NAMES[lang] || lang
            return (
              <Button
                key={lang}
                variant={selectedLanguage === lang ? "default" : "outline"}
                size="default"
                onClick={() => setSelectedLanguage(lang)}
                className="rounded-full flex items-center gap-2 h-10 px-4"
                aria-label={`Select ${name} language`}
                aria-checked={selectedLanguage === lang}
                role="radio"
              >
                <span className="text-lg">{flag}</span>
                <span className="text-sm font-medium">{name}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Speed Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="speed-slider" className="text-sm font-medium">Speed</label>
          <span className="text-sm font-medium text-muted-foreground">{speed[0].toFixed(2)}x</span>
        </div>
        <Slider
          id="speed-slider"
          value={speed}
          onValueChange={setSpeed}
          min={0.25}
          max={2.0}
          step={0.05}
          className="w-full"
          aria-label="Narration speed"
          aria-valuemin={0.25}
          aria-valuemax={2.0}
          aria-valuenow={speed[0]}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.25x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Narrate Button */}
      <Button 
        onClick={handleNarrate} 
        disabled={!selectedVoiceId || isGenerating || isLoadingVoices}
        className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 rounded-lg px-6"
        size="lg"
        aria-label={isGenerating ? "Generating narration" : "Narrate story"}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Narrate Story
          </>
        )}
      </Button>

      {/* Voice Selection - Smaller Voice Library Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Select Voice</h3>
          
          {/* Voice Category Filters */}
          <div className="flex gap-2 flex-wrap mb-4" role="tablist" aria-label="Filter voices by category">
            <Button
              variant={activeVoiceCategory === "all" ? "default" : "ghost"}
              onClick={() => setActiveVoiceCategory("all")}
              size="sm"
              className="rounded-full text-xs h-7 px-3"
              role="tab"
              aria-selected={activeVoiceCategory === "all"}
              aria-label="Show all voices"
            >
              All
            </Button>
            <Button
              variant={activeVoiceCategory === "family" ? "default" : "ghost"}
              onClick={() => setActiveVoiceCategory("family")}
              size="sm"
              className="rounded-full text-xs h-7 px-3"
              role="tab"
              aria-selected={activeVoiceCategory === "family"}
              aria-label="Show family voices"
            >
              Family
            </Button>
            <Button
              variant={activeVoiceCategory === "educators" ? "default" : "ghost"}
              onClick={() => setActiveVoiceCategory("educators")}
              size="sm"
              className="rounded-full text-xs h-7 px-3"
              role="tab"
              aria-selected={activeVoiceCategory === "educators"}
              aria-label="Show educator voices"
            >
              Educators
            </Button>
            <Button
              variant={activeVoiceCategory === "narrators" ? "default" : "ghost"}
              onClick={() => setActiveVoiceCategory("narrators")}
              size="sm"
              className="rounded-full text-xs h-7 px-3"
              role="tab"
              aria-selected={activeVoiceCategory === "narrators"}
              aria-label="Show narrator voices"
            >
              Narrators
            </Button>
          </div>

          {/* Voice Cards - Smaller versions of voice library */}
          {isLoadingVoices ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading voices...
            </div>
          ) : voices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No voices available. Please add voices to your library.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredVoices.map((voice) => {
                const borderGradient = getVoiceBorderGradient(voice.name)
                const isSelected = selectedVoiceId === voice.id
                const voiceType = getVoiceTypeLabel(voice)
                const tagString = voice.tags?.join(" • ") || ""
                
                return (
                  <div
                    key={voice.id}
                    className={cn(
                      "relative rounded-xl transition-all hover:shadow-lg flex flex-col p-[1px] cursor-pointer",
                      `bg-gradient-to-r ${borderGradient}`,
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => { setSelectedVoiceId(voice.id); if (isDemoMode()) setDemoPreferredVoice(voice.id) }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedVoiceId(voice.id)
                        if (isDemoMode()) setDemoPreferredVoice(voice.id)
                      }
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                  >
                    <Card className="glass-card relative overflow-hidden rounded-xl border-0 h-full flex-1 flex flex-col">
                      <CardContent className="p-3 sm:p-4 flex flex-col h-full flex-1">
                        {/* Header with Title and Checkmark */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <h4 className="text-base sm:text-lg font-bold text-foreground truncate">
                              {voice.name}
                            </h4>
                            {isSelected && (
                              <div className="h-3 w-3 rounded-full flex items-center justify-center bg-primary flex-shrink-0">
                                <CheckCircle2 className="h-2 w-2 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {voice.description && (
                          <p className="text-xs sm:text-sm mb-2 leading-relaxed text-muted-foreground line-clamp-2">
                            {voice.description}
                          </p>
                        )}

                        {/* Tags */}
                        {tagString && (
                          <p className="text-xs mb-2 text-muted-foreground/70">
                            {tagString} • {voiceType}
                          </p>
                        )}

                        {/* Preview Button */}
                        <div className="mt-auto pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVoicePreview(voice.id, voice.name)
                            }}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                              isSelected
                                ? "bg-primary/10 hover:bg-primary/20 text-primary"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            )}
                            aria-label={`Preview ${voice.name}`}
                          >
                            {playingPreviewId === voice.id ? (
                              <>
                                <Pause className="h-3 w-3" />
                                <span>Playing...</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Bottom Tab with Gradient */}
                    <div 
                      className={cn(
                        "h-2 rounded-b-xl -mt-[1px]",
                        `bg-gradient-to-r ${borderGradient}`
                      )}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>


      {/* Saved Audio Variations */}
      {savedAudios.length > 0 && (
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-lg font-semibold">Saved Variations</h3>
          <div className="grid grid-cols-1 gap-4">
            {savedAudios.map((audio) => (
              <SavedAudioVariation 
                key={audio.id} 
                audio={audio}
                onUpdate={handleUpdateVariation}
                onDelete={handleDeleteVariation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

