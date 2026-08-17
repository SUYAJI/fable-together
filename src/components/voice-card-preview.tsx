"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, Loader2 } from "lucide-react"
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, getLanguageData, getLanguageFlag } from "@/lib/language-codes"
import { AudioWaveform } from "@/components/audio-waveform"
import { cn } from "@/lib/utils"

interface VoiceCardPreviewProps {
  voiceId: string
  voiceName: string
  className?: string
}

// Preview text for each language
const getPreviewText = (language: string, voiceName: string): string => {
  const texts: Record<string, string> = {
    en: `Hello, this is a preview of ${voiceName}`,
    es: `Hola, esta es una vista previa de ${voiceName}`,
    fr: `Bonjour, ceci est un aperçu de ${voiceName}`,
    zh: `你好，这是 ${voiceName} 的预览`,
    hi: `नमस्ते, यह ${voiceName} का पूर्वावलोकन है`,
  }
  return texts[language] || texts.en
}

export function VoiceCardPreview({ 
  voiceId, 
  voiceName,
  className
}: VoiceCardPreviewProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audioUrl, audio])

  // Reset audio when language changes
  useEffect(() => {
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
    setAudioUrl(null)
  }, [selectedLanguage])

  const handlePreview = useCallback(async () => {
    if (isPlaying) {
      // Stop current audio
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
      }
      return
    }

    if (audioUrl) {
      // Play existing audio
      const audioElement = new Audio(audioUrl)
      audioElement.onended = () => setIsPlaying(false)
      audioElement.onerror = () => setIsPlaying(false)
      try {
        await audioElement.play()
        setAudio(audioElement)
        setIsPlaying(true)
      } catch (error) {
        console.error("Error playing audio:", error)
        setIsPlaying(false)
      }
      return
    }

    // Generate new preview
    setIsLoading(true)
    try {
      const response = await fetch("/api/voices/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceId,
          text: getPreviewText(selectedLanguage, voiceName),
          language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate preview")
      }

      const audioBlob = await response.blob()
      const newAudioUrl = URL.createObjectURL(audioBlob)
      setAudioUrl(newAudioUrl)

      // Play the audio
      const audioElement = new Audio(newAudioUrl)
      audioElement.onended = () => {
        setIsPlaying(false)
      }
      audioElement.onerror = () => {
        setIsPlaying(false)
      }
      
      try {
        await audioElement.play()
        setAudio(audioElement)
        setIsPlaying(true)
      } catch (playError) {
        console.error("Error playing audio:", playError)
        setIsPlaying(false)
      }
    } catch (error) {
      console.error("Error generating voice preview:", error)
    } finally {
      setIsLoading(false)
    }
  }, [voiceId, voiceName, selectedLanguage, isPlaying, audioUrl, audio])

  return (
    <div className={cn("space-y-3", className)}>
      {/* Language Dropdown */}
      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select language">
            {selectedLanguage && (() => {
              const langData = getLanguageData(selectedLanguage)
              const flag = getLanguageFlag(selectedLanguage)
              const name = langData?.name || LANGUAGE_NAMES[selectedLanguage] || selectedLanguage
              return (
                <div className="flex items-center gap-2">
                  <span className="text-base">{flag}</span>
                  <span>{name}</span>
                </div>
              )
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const langData = getLanguageData(lang)
            const flag = getLanguageFlag(lang)
            const name = langData?.name || LANGUAGE_NAMES[lang] || lang
            return (
              <SelectItem key={lang} value={lang}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{flag}</span>
                  <span>{name}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {/* Waveform and Play Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handlePreview}
          disabled={isLoading}
          className={cn(
            "flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-colors touch-manipulation",
            isPlaying
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted hover:bg-muted/80 text-foreground"
          )}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          ) : (
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </button>
        <div className="flex-1 min-w-0 w-full">
          <AudioWaveform audio={audio} isPlaying={isPlaying} barCount={32} className="w-full" />
        </div>
      </div>
    </div>
  )
}

