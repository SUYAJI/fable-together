"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { AudioPlayer } from "@/components/audio-player"
import { SUPPORTED_LANGUAGES, getLanguageData, getLanguageFlag } from "@/lib/language-codes"

interface Creator {
  id: string
  name: string
  role: "Author" | "Illustrator" | "Musician"
  avatar?: string
  bio?: string
}

interface Story {
  id: number
  title: string
  category: string
  duration: string
  rating: number
  thumbnail: string
  creators: Creator[]
  tokens: number
  body?: string
  audioUrl?: string
  isExample?: boolean
}

interface StoryPlayerModalProps {
  story: Story | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoryPlayerModal({ story, open, onOpenChange }: StoryPlayerModalProps) {
  const [highlightedWord, setHighlightedWord] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM")
  const [availableVoices, setAvailableVoices] = useState([
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Female, American" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Female, American" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Female, American" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Male, American" },
    { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Female, American" }
  ])
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [backgroundMusic, setBackgroundMusic] = useState(false)
  const [soundEffects, setSoundEffects] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const textRef = useRef<HTMLDivElement>(null)

  // Fetch available voices from API
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices')
        if (response.ok) {
          const data = await response.json()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const voices = data.voices.filter((voice: any) => voice.is_preset).slice(0, 5)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAvailableVoices(voices.map((voice: any) => ({
            id: voice.id,
            name: voice.name,
            description: `${voice.gender}, ${voice.accent}`
          })))
        }
      } catch (error) {
        console.error('Error fetching voices:', error)
      }
    }
    fetchVoices()
  }, [])

  // Use static MP3 files for example stories
  useEffect(() => {
    if (!story) return

    if (story.isExample) {
      // Use static MP3 files for example stories
      const audioFileName = getAudioFileName(story.id)
      setAudioUrl(`/audio/examples/${audioFileName}`)
    } else {
      // For non-example stories, use stored URLs
      setAudioUrl(story.audioUrl || null)
    }
  }, [story])

  const handleRegenerateAudio = async () => {
    if (!story?.isExample) return
    
    setIsRegenerating(true)
    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exampleStoryId: story.id,
          voiceId: selectedVoice,
          language: selectedLanguage,
          backgroundMusic,
          soundEffects
        })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate audio')
      }

      const data = await response.json()
      setAudioUrl(data.audioUrl)
    } catch (error) {
      console.error('Error regenerating audio:', error)
      alert('Failed to regenerate audio. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  // Text synchronization effect
  useEffect(() => {
    if (!audioRef.current || !story?.body) return

    const audio = audioRef.current
    const updateHighlight = () => {
      const totalDuration = audio.duration || 0
      const progress = audio.currentTime / totalDuration
      const wordCount = story.body?.split(" ").length || 0
      const currentWord = Math.floor(progress * wordCount)
      setHighlightedWord(currentWord)
    }

    audio.addEventListener("timeupdate", updateHighlight)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateHighlight)
    }
  }, [audioUrl, story])

  // Auto-scroll to highlighted text
  useEffect(() => {
    if (textRef.current && highlightedWord > 0) {
      const words = textRef.current.querySelectorAll(".word")
      const targetWord = words[highlightedWord]
      if (targetWord) {
        targetWord.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [highlightedWord])

  const getAudioFileName = (storyId: number) => {
    const audioFiles: Record<number, string> = {
      1: "adventure-begins.mp3",
      2: "mystery-unfolds.mp3", 
      3: "enchanted-forest.mp3"
    }
    return audioFiles[storyId] || "default-story.mp3"
  }

  const handleTimeUpdate = (current: number, total: number) => {
    setCurrentTime(current)
    setDuration(total)
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  if (!story) return null

  return (
    <Dialog open={open} onOpenChange={(v) => {
      // stop audio if closing
      if (!v && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      onOpenChange(v)
    }}>
      <DialogContent 
        showCloseButton={false}
        className="modal-content max-w-full mx-4 sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[calc(100vh-4rem)] overflow-y-auto p-0 fixed top-4 sm:top-8 lg:top-20 left-1/2 translate-x-[-50%] translate-y-0 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Story Player</DialogTitle>
          <DialogDescription>Listen and control playback</DialogDescription>
        </DialogHeader>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute left-4 top-4 z-10 flex items-center gap-2 px-4 py-2 rounded-lg bg-background/90 backdrop-blur-sm border hover:bg-background transition-colors shadow-sm"
          aria-label="Back to Story Library"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Story Image */}
          <div className="story-thumbnail relative overflow-hidden">
            <Image
              src={story.thumbnail || "/placeholder.svg"}
              alt={story.title}
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Audio Player */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Audio Player</h3>
            
            {/* Audio Controls for Example Stories */}
            {story.isExample && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voice</label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} ({voice.description})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => {
                          const langData = getLanguageData(lang)
                          const flag = getLanguageFlag(lang)
                          const name = langData?.name || lang
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
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="backgroundMusic" 
                      checked={backgroundMusic}
                      onCheckedChange={(checked) => setBackgroundMusic(checked as boolean)}
                    />
                    <label htmlFor="backgroundMusic" className="text-sm font-medium">
                      Background Music
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="soundEffects" 
                      checked={soundEffects}
                      onCheckedChange={(checked) => setSoundEffects(checked as boolean)}
                    />
                    <label htmlFor="soundEffects" className="text-sm font-medium">
                      Sound Effects
                    </label>
                  </div>
                </div>
                
                <Button 
                  onClick={handleRegenerateAudio}
                  disabled={isRegenerating}
                  className="w-full"
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate Audio"}
                </Button>
              </div>
            )}
            
            {audioUrl ? (
              <AudioPlayer
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center p-8 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">Audio not available</p>
              </div>
            )}
          </div>

          {/* Story Text with Highlighting */}
          {story.body && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Story Text</h3>
              <div 
                ref={textRef}
                className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg text-base leading-relaxed"
              >
                {story.body.split(" ").map((word, index) => (
                  <span
                    key={index}
                    className={`word inline-block mr-1 transition-colors ${
                      index === highlightedWord 
                        ? "bg-yellow-200 font-semibold rounded px-1" 
                        : ""
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creators */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Story Creators</h3>
            {story.creators.map((creator) => (
              <div
                key={creator.id}
                className="card-elevated flex items-start gap-4 p-4"
              >
                <Avatar className="avatar-ring h-16 w-16 flex-shrink-0">
                  <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                    {creator.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">
                      {creator.name}
                    </h4>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {creator.role}
                    </Badge>
                  </div>
                  {creator.bio && <p className="text-sm text-gray-600 leading-relaxed">{creator.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}