"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Download, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { AudioWaveform } from "@/components/audio-waveform"
import { Loader2 } from "lucide-react"

interface EnhancedAudioPlayerProps {
  audio: HTMLAudioElement | null
  audioUrl: string | null
  isPlaying: boolean
  onPlayPause: () => void
  onDownload?: () => void
  onSave?: () => void
  isSaving?: boolean
  className?: string
  showActions?: boolean
}

export function EnhancedAudioPlayer({
  audio,
  audioUrl,
  isPlaying,
  onPlayPause,
  onDownload,
  onSave,
  isSaving = false,
  className,
  showActions = true,
}: EnhancedAudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1.0)
  const [isMuted, setIsMuted] = useState(false)
  const previousVolumeRef = useRef<number>(1.0)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update current time and duration
  useEffect(() => {
    if (!audio) {
      setCurrentTime(0)
      setDuration(0)
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
        timeUpdateIntervalRef.current = null
      }
      return
    }

    const updateTime = () => {
      if (audio) {
        setCurrentTime(audio.currentTime || 0)
        if (audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration)
        }
      }
    }

    const handleLoadedMetadata = () => {
      if (audio && audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleTimeUpdate = () => {
      if (audio) {
        setCurrentTime(audio.currentTime || 0)
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    // Also poll for updates in case timeupdate doesn't fire frequently enough
    timeUpdateIntervalRef.current = setInterval(updateTime, 100)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
        timeUpdateIntervalRef.current = null
      }
    }
  }, [audio])

  // Sync volume with audio element
  useEffect(() => {
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
  }, [audio, volume, isMuted])

  const handleSeek = (value: number[]) => {
    if (!audio) return
    const newTime = (value[0] / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (newVolume > 0) {
      setIsMuted(false)
      previousVolumeRef.current = newVolume
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolumeRef.current)
      setIsMuted(false)
    } else {
      previousVolumeRef.current = volume
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!audioUrl || !audio) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Waveform - Full Width */}
      <div className="w-full overflow-hidden">
        <AudioWaveform audio={audio} isPlaying={isPlaying} barCount={60} className="w-full" />
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onPlayPause}
          className="rounded-full h-10 w-10 flex-shrink-0"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {/* Time Display and Scrubber */}
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground min-w-[35px] tabular-nums">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
              aria-label="Seek audio"
            />
            <span className="text-xs font-medium text-muted-foreground min-w-[35px] tabular-nums text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-20"
            aria-label="Volume"
          />
        </div>

        {/* Action Buttons */}
        {showActions && (
          <>
            {onDownload && (
              <Button
                variant="outline"
                size="icon"
                onClick={onDownload}
                className="rounded-full h-10 w-10 flex-shrink-0"
                aria-label="Download audio"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="flex-shrink-0"
                aria-label={isSaving ? "Saving audio variation" : "Save audio variation"}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3 w-3" />
                    Save
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

