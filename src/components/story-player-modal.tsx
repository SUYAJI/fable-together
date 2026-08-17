"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ArrowLeft, Pause, Play } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AudioPlayer } from "@/components/audio-player"
import { createBrowserNarration, isBrowserNarrationAvailable } from "@/lib/browser-narration"

interface Creator {
  id: string
  name: string
  role: "Author" | "Illustrator" | "Musician"
  avatar?: string
  bio?: string
}

export interface PlayerStory {
  id: number
  title: string
  thumbnail: string
  creators: Creator[]
  body?: string
}

export interface PlayerNarration {
  playback: "audio" | "browser-speech"
  audioUrl?: string
  text: string
  voiceName: string
  speed: number
  disclosure?: string
}

interface StoryPlayerModalProps {
  story: PlayerStory
  narration: PlayerNarration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoryPlayerModal({ story, narration, open, onOpenChange }: StoryPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [isBrowserPlaying, setIsBrowserPlaying] = useState(false)
  const [isBrowserPaused, setIsBrowserPaused] = useState(false)
  const [highlightedWord, setHighlightedWord] = useState(0)
  const textRef = useRef<HTMLDivElement>(null)

  const stopBrowserNarration = () => {
    if (isBrowserNarrationAvailable()) window.speechSynthesis.cancel()
    utteranceRef.current = null
    setIsBrowserPlaying(false)
    setIsBrowserPaused(false)
  }

  useEffect(() => () => stopBrowserNarration(), [])

  useEffect(() => {
    if (!open) {
      audioRef.current?.pause()
      stopBrowserNarration()
    }
  }, [open])

  const handleBrowserPlayback = () => {
    if (!narration || narration.playback !== "browser-speech" || !isBrowserNarrationAvailable()) return

    if (isBrowserPlaying && !isBrowserPaused) {
      window.speechSynthesis.pause()
      setIsBrowserPaused(true)
      return
    }
    if (isBrowserPaused) {
      window.speechSynthesis.resume()
      setIsBrowserPaused(false)
      return
    }

    const utterance = createBrowserNarration(narration.text, narration.speed)
    if (!utterance) return
    utterance.onend = () => {
      setIsBrowserPlaying(false)
      setIsBrowserPaused(false)
      setHighlightedWord(0)
    }
    utterance.onerror = () => {
      setIsBrowserPlaying(false)
      setIsBrowserPaused(false)
    }
    utterance.onboundary = (event) => {
      const wordsBeforeBoundary = narration.text.slice(0, event.charIndex).trim().split(/\s+/).filter(Boolean).length
      setHighlightedWord(wordsBeforeBoundary)
    }
    window.speechSynthesis.cancel()
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsBrowserPlaying(true)
  }

  useEffect(() => {
    if (!textRef.current || highlightedWord < 1) return
    textRef.current.querySelectorAll(".word")[highlightedWord]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightedWord])

  const isAudioNarration = narration?.playback === "audio" && Boolean(narration.audioUrl)
  const browserUnavailable = narration?.playback === "browser-speech" && !isBrowserNarrationAvailable()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="modal-content max-w-full mx-4 sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[calc(100vh-4rem)] overflow-y-auto p-0 fixed top-4 sm:top-8 lg:top-20 left-1/2 translate-x-[-50%] translate-y-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Story Player</DialogTitle>
          <DialogDescription>Listen and control playback</DialogDescription>
        </DialogHeader>

        <button onClick={() => onOpenChange(false)} className="absolute left-4 top-4 z-10 flex items-center gap-2 px-4 py-2 rounded-lg bg-background/90 backdrop-blur-sm border hover:bg-background transition-colors shadow-sm" aria-label="Close story player">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="story-thumbnail relative overflow-hidden rounded-xl h-64">
            <Image src={story.thumbnail || "/placeholder.svg"} alt={story.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>

          <section className="space-y-3" aria-label="Story player controls">
            <div>
              <h3 className="text-lg font-semibold">Story Player</h3>
              {narration && <p className="text-sm text-muted-foreground">{narration.voiceName} · {narration.speed.toFixed(2)}x</p>}
            </div>

            {isAudioNarration ? (
              <AudioPlayer src={narration.audioUrl!} audioRef={audioRef} />
            ) : narration?.playback === "browser-speech" ? (
              <div className="space-y-3 rounded-xl bg-muted/30 p-4">
                <p className="text-sm font-medium">{narration.disclosure || "Browser narration preview"}</p>
                <p className="text-sm text-muted-foreground">Uses an available system voice. Seeking is unavailable because browser speech is streamed by the browser.</p>
                {browserUnavailable ? (
                  <p className="text-sm text-destructive">Browser narration is not available in this browser.</p>
                ) : (
                  <Button onClick={handleBrowserPlayback} aria-label={isBrowserPlaying && !isBrowserPaused ? "Pause browser narration" : "Play browser narration"}>
                    {isBrowserPlaying && !isBrowserPaused ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isBrowserPlaying && !isBrowserPaused ? "Pause" : isBrowserPaused ? "Resume" : "Play narration"}
                  </Button>
                )}
              </div>
            ) : (
              <p className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">Narration is not available yet.</p>
            )}
          </section>

          {story.body && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Story Text</h3>
              <div ref={textRef} className="max-h-64 overflow-y-auto rounded-lg bg-muted/30 p-4 text-base leading-relaxed" aria-label="Story text">
                {story.body.split(" ").map((word, index) => (
                  <span key={`${word}-${index}`} className={`word inline-block mr-1 transition-colors ${index === highlightedWord ? "bg-yellow-200 dark:bg-yellow-800 font-semibold rounded px-1" : ""}`}>{word}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
