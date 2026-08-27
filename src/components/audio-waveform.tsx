"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AudioWaveformProps {
  audio: HTMLAudioElement | null
  isPlaying: boolean
  className?: string
  barCount?: number
}

export function AudioWaveform({ 
  audio, 
  isPlaying, 
  className,
  barCount = 20 
}: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(new Array(barCount).fill(0.3))
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (!audio || !isPlaying) {
      // Reset to static state when not playing
      setHeights(new Array(barCount).fill(0.15))
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    // Create audio context and analyser
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) {
        // Fallback: animate bars randomly when audio context is not available
        const updateWaveform = () => {
          if (!isPlaying) {
            setHeights(new Array(barCount).fill(0.15))
            return
          }
          // More varied random heights for better visualization
          const newHeights = new Array(barCount).fill(0).map(() => {
            const base = 0.15 + Math.random() * 0.3
            const variation = Math.random() * 0.5
            return Math.min(1.0, base + variation)
          })
          setHeights(newHeights)
          animationFrameRef.current = requestAnimationFrame(updateWaveform)
        }
        updateWaveform()
        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
        }
      }

      const audioContext = new AudioContextClass()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256 // Larger FFT size for better frequency resolution
      analyser.smoothingTimeConstant = 0.3 // Lower smoothing for more dynamic response

      const source = audioContext.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      dataArrayRef.current = dataArray

      // Animation loop
      const updateWaveform = () => {
        if (!analyser || !isPlaying) {
          setHeights(new Array(barCount).fill(0.15))
          return
        }

        analyser.getByteFrequencyData(dataArray)
        
        // Map frequency data to bar heights with better distribution
        const newHeights = new Array(barCount).fill(0)
        const dataLength = dataArray.length
        
        // Use logarithmic distribution for better visual representation
        for (let i = 0; i < barCount; i++) {
          // Logarithmic index mapping for better frequency distribution
          const logIndex = Math.floor(Math.pow(dataLength, i / barCount))
          const index = Math.min(logIndex, dataLength - 1)
          
          // Average nearby values for smoother visualization
          const windowSize = Math.max(1, Math.floor(dataLength / barCount / 4))
          let sum = 0
          let count = 0
          
          for (let j = Math.max(0, index - windowSize); j < Math.min(dataLength, index + windowSize); j++) {
            sum += dataArray[j] || 0
            count++
          }
          
          const avgValue = count > 0 ? sum / count : 0
          // Normalize to 0-1 range with better scaling
          // Use square root for more dynamic range
          const normalized = Math.sqrt(avgValue / 255)
          // Ensure minimum height but allow more variation
          newHeights[i] = Math.max(0.15, Math.min(1.0, normalized * 1.2))
        }
        
        setHeights(newHeights)
        animationFrameRef.current = requestAnimationFrame(updateWaveform)
      }

      updateWaveform()

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {
            // Ignore errors when closing
          })
        }
      }
    } catch (error) {
      console.warn("Audio context not available, using fallback animation:", error)
      // Fallback: animate bars randomly
      const updateWaveform = () => {
        if (!isPlaying) {
          setHeights(new Array(barCount).fill(0.15))
          return
        }
        // More varied random heights for better visualization
        const newHeights = new Array(barCount).fill(0).map(() => {
          const base = 0.15 + Math.random() * 0.3
          const variation = Math.random() * 0.5
          return Math.min(1.0, base + variation)
        })
        setHeights(newHeights)
        animationFrameRef.current = requestAnimationFrame(updateWaveform)
      }
      updateWaveform()
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [audio, isPlaying, barCount])

  return (
    <div
      className={cn("grid min-w-0 items-end gap-px sm:gap-1 h-16 sm:h-20 w-full max-w-full overflow-hidden px-1 sm:px-2", className)}
      style={{ gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))` }}
    >
      {heights.map((height, index) => (
        <div
          key={index}
          className={cn(
            "min-w-0 w-full rounded-full transition-all duration-75",
            isPlaying ? "bg-primary" : "bg-muted-foreground/30"
          )}
          style={{
            height: `${Math.max(15, height * 100)}%`,
            minHeight: '15%',
          }}
        />
      ))}
    </div>
  )
}

