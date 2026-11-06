"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
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
import { ELEVENLABS_LANGUAGE_MAP, LANGUAGE_NAMES, SUPPORTED_LANGUAGES, getLanguageData } from "@/lib/language-codes"
import { filterCuratedVoices } from "@/lib/voice-filters"
import { EnhancedAudioPlayer } from "@/components/enhanced-audio-player"
import { cn } from "@/lib/utils"
import { StoryPlayerModal, type PlayerStory, type PlayerNarration } from "@/components/story-player-modal"
import { createBrowserNarration, getBrowserNarrationUnavailableMessage, isBrowserNarrationAvailable } from "@/lib/browser-narration"
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
    setError(null)
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
        const utterance = await createBrowserNarration(previewText, 1, voiceId, selectedLanguage)
        if (!utterance) {
          setError(getBrowserNarrationUnavailableMessage(selectedLanguage))
          setPlayingPreviewId(null)
          return
        }
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
          const utterance = await createBrowserNarration(preview.text, 1, voiceId, selectedLanguage)
          if (!utterance) {
            setError(getBrowserNarrationUnavailableMessage(selectedLanguage))
            setPlayingPreviewId(null)
            return
          }
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
    if (isBrowserNarrationAvailable()) window.speechSynthesis.cancel()
    setPlayingPreviewId(null)
    setError(null)
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

  const voiceFilters: { id: typeof activeVoiceCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "family", label: "Family" },
    { id: "educators", label: "Educators" },
    { id: "narrators", label: "Narrators" },
  ]
  const selectedVoiceName = voices.find((voice) => voice.id === selectedVoiceId)?.name
  const selectedLanguageName =
    getLanguageData(selectedLanguage)?.name || LANGUAGE_NAMES[selectedLanguage] || selectedLanguage
  const usesLatinScript = ["en", "es", "fr"].includes(selectedLanguage)

  return (
    <div className="w-full space-y-10">
      <StoryPlayerModal
        story={story}
        narration={narration}
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
        {/* Reading page */}
        <section aria-labelledby="story-text-heading" className="order-2 lg:order-1">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="story-text-heading" className="text-2xl">The story</h2>
            <span className="text-sm text-muted-foreground">{selectedLanguageName}</span>
          </div>
          <div
            className="rounded-3xl border bg-card px-6 py-8 sm:px-10 sm:py-12"
            role="region"
            aria-label="Story text"
            aria-live="polite"
          >
            {isTranslating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Translating to {selectedLanguageName}...</span>
              </div>
            ) : (
              <p
                lang={selectedLanguage}
                className={cn(
                  "story-prose max-w-[62ch] whitespace-pre-wrap text-foreground",
                  usesLatinScript && "story-dropcap",
                )}
              >
                {translatedText}
              </p>
            )}
          </div>
        </section>

        {/* Listen panel: voice, language, speed, narrate, play */}
        <section aria-labelledby="listen-heading" className="order-1 lg:order-2">
          <div className="rounded-3xl border bg-card p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 id="listen-heading" className="text-2xl">Listen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose who reads, in which language, then press Narrate.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            {/* 1. Voice */}
            <fieldset className="mt-6">
              <legend className="mb-3 flex items-center gap-2 text-sm font-medium">
                <span className="step-number">1</span>
                Voice
              </legend>

              <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter voices by category">
                {voiceFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveVoiceCategory(filter.id)}
                    role="tab"
                    aria-selected={activeVoiceCategory === filter.id}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      activeVoiceCategory === filter.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {isLoadingVoices ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading voices...
                </div>
              ) : voices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No voices yet. Add one from the Voice Library.</p>
              ) : (
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1" role="radiogroup" aria-label="Narration voice">
                  {filteredVoices.map((voice) => {
                    const isSelected = selectedVoiceId === voice.id
                    const voiceType = getVoiceTypeLabel(voice)
                    const selectVoice = () => {
                      setSelectedVoiceId(voice.id)
                      if (isDemoMode()) setDemoPreferredVoice(voice.id)
                    }

                    return (
                      <div
                        key={voice.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected ? "border-lantern bg-lantern-soft" : "hover:bg-accent/60",
                        )}
                        onClick={selectVoice}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            selectVoice()
                          }
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                            isSelected ? "border-lantern" : "border-muted-foreground/50",
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && <span className="h-2 w-2 rounded-full bg-lantern" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{voice.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {voice.tags?.length ? `${voice.tags.join(" · ")} · ${voiceType}` : voiceType}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleVoicePreview(voice.id, voice.name)
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={playingPreviewId === voice.id ? `Stop preview of ${voice.name}` : `Preview ${voice.name}`}
                        >
                          {playingPreviewId === voice.id ? (
                            <Pause className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Play className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </fieldset>

            {/* 2. Language */}
            <fieldset className="mt-6">
              <legend className="mb-3 flex items-center gap-2 text-sm font-medium">
                <span className="step-number">2</span>
                Language
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Narration language">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const langData = getLanguageData(lang)
                  const name = langData?.name || LANGUAGE_NAMES[lang] || lang
                  const isSelected = selectedLanguage === lang
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={name}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "border-lantern bg-lantern-soft font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <span lang={lang}>{langData?.nativeName || name}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {/* 3. Speed */}
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="speed-slider" className="flex items-center gap-2 text-sm font-medium">
                  <span className="step-number">3</span>
                  Speed
                </label>
                <span className="text-sm tabular-nums text-muted-foreground">{speed[0].toFixed(2)}x</span>
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
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Slower</span>
                <span>Faster</span>
              </div>
            </div>

            <Button
              onClick={handleNarrate}
              disabled={!selectedVoiceId || isGenerating || isLoadingVoices}
              className="mt-6 w-full gap-2"
              size="lg"
              aria-label={isGenerating ? "Generating narration" : "Narrate story"}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Preparing narration...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Narrate{selectedVoiceName ? ` with ${selectedVoiceName}` : ""}
                </>
              )}
            </Button>

            {/* Result */}
            <div className="mt-5" aria-live="polite">
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
                <div className="rounded-2xl border border-lantern/40 bg-lantern-soft p-4">
                  <p className="text-sm font-medium">Ready with {narration.voiceName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {narration.disclosure || "Plays with your browser's built-in speech voice."}
                  </p>
                  <Button onClick={() => setIsPlayerOpen(true)} className="mt-3 w-full gap-2" variant="outline" aria-label="Open story player">
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Open story player
                  </Button>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                  Your narration will appear here.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Saved Audio Variations */}
      {savedAudios.length > 0 && (
        <section className="space-y-4 border-t pt-8" aria-labelledby="variations-heading">
          <h2 id="variations-heading" className="text-2xl">Saved narrations</h2>
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
        </section>
      )}
    </div>
  )
}
