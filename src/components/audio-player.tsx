/**
 * Audio Player Component
 * 
 * Basic audio player with play/pause, volume control, and progress tracking.
 * Supports auto-play, external audio ref, and time update callbacks.
 * 
 * Features:
 * - Play/pause controls
 * - Volume control with mute toggle
 * - Progress bar with scrubbing
 * - Time display (current/total)
 * - Auto-play support (with browser policy handling)
 * - Responsive design
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Audio player component props
 */
interface AudioPlayerProps {
  src: string
  className?: string
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onPlay?: () => void
  onPause?: () => void
  autoPlay?: boolean
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>
}

export function AudioPlayer({ 
  src, 
  className, 
  onTimeUpdate, 
  onPlay, 
  onPause,
  autoPlay = false,
  audioRef: externalAudioRef
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const previousVolumeRef = useRef<number>(1.0) // Store previous volume before muting
  const internalAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioRef = externalAudioRef || internalAudioRef
  const hasAutoPlayedRef = useRef(false) // Track if we've already attempted auto-play

  useEffect(() => {
    // Reset auto-play tracking when src changes
    hasAutoPlayedRef.current = false
    
    const audio = new Audio(src)
    audioRef.current = audio

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      
      // Auto-play after metadata is loaded (audio is ready to play)
      // Only attempt once per audio load
      if (autoPlay && !hasAutoPlayedRef.current) {
        hasAutoPlayedRef.current = true
        audio.play().then(() => {
          setIsPlaying(true)
          onPlay?.()
        }).catch((error) => {
          console.error('Auto-play prevented:', error)
          // Browser blocked auto-play, that's okay - user can click play
        })
      }
    }

    const handleCanPlay = () => {
      // Also try auto-play when audio can play (in case loadedmetadata fired too early)
      // Only attempt if we haven't already tried
      if (autoPlay && !isPlaying && !hasAutoPlayedRef.current) {
        hasAutoPlayedRef.current = true
        audio.play().then(() => {
          setIsPlaying(true)
          onPlay?.()
        }).catch(() => {
          // Auto-play blocked - that's okay
        })
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      onTimeUpdate?.(audio.currentTime, audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
      audio.currentTime = 0
    }
  }, [src, onTimeUpdate, autoPlay, onPlay])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      onPause?.()
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      onPlay?.()
    }
  }

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return
    const newTime = (value[0] / 100) * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    if (isMuted) {
      audioRef.current.volume = previousVolumeRef.current
      setIsMuted(false)
    } else {
      previousVolumeRef.current = audioRef.current.volume || 1.0
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn("flex items-center gap-4 p-4 bg-muted/30 rounded-xl", className)}>
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlayPause}
        className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? (
          <Pause className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
        ) : (
          <Play className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
        )}
      </Button>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={toggleMute}
        className="h-10 w-10"
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        aria-pressed={isMuted}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}
