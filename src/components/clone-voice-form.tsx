"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Mic, MicOff, Play, Pause, Volume2, CheckCircle2, AlertCircle, Info, Loader2, Trash2, Save, ArrowRight, ArrowLeft, Sparkles, RefreshCw, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AudioWaveform } from "@/components/audio-waveform"
import { EnhancedAudioPlayer } from "@/components/enhanced-audio-player"
import { SUPPORTED_LANGUAGES, getLanguageData, getLanguageFlag, ELEVENLABS_LANGUAGE_MAP } from "@/lib/language-codes"
import { getVoiceBorderGradient } from "@/lib/voice-colors"
import { cn } from "@/lib/utils"
import { isDemoMode } from "@/lib/app-mode"
import { createDemoVoice } from "@/lib/services/demo/state"

// Example text script for reading (approximately 60 seconds at normal pace)
const EXAMPLE_SCRIPT = "Welcome to the voice cloning recording session. This script is designed to take approximately sixty seconds to read at a normal speaking pace. Please read this text clearly and naturally, maintaining a consistent tone and volume throughout. As you read, imagine you're speaking to a friend or family member. Take your time, and don't rush. The goal is to capture the natural rhythm and cadence of your voice. Make sure you're in a quiet environment with minimal background noise. Speak at your normal volume, neither too loud nor too quiet. Enunciate your words clearly, but speak naturally. This recording will help create a high-quality digital copy of your voice that can be used to narrate stories and bring your family's voices to life. Continue reading until you've finished this entire passage. Thank you for taking the time to create your voice clone. This process is important for ensuring the best possible results."

type Step = 1 | 2 | 3 | 4 | 5

const STORAGE_KEY = "clone-voice-progress"

interface SavedProgress {
  currentStep: Step
  voiceName: string
  selectedFileUrl?: string
  selectedFileName?: string
  uploadMethod: "upload" | "record"
  recordedAudio?: string
  recordedDuration: number
  totalRecordingTime: number
  savedRecordings: Array<{ url: string; duration: number; timestamp: number; removeBackgroundNoise?: boolean }>
  clonedVoiceId: string | null
  instantVoiceId: string | null
  saveVoiceName: string
  saveVoiceTags: string[]
  saveVoiceDescription: string
  clonePreviewUrls: Record<string, string>
  removeBackgroundNoise?: boolean
  timestamp: number
}

export function CloneVoiceForm() {
  // Load saved progress from localStorage on mount
  const loadSavedProgress = (): Partial<SavedProgress> | null => {
    if (isDemoMode()) return null
    if (typeof window === "undefined") return null
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved) as SavedProgress
        // Only restore if saved within last 7 days
        const daysSinceSave = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24)
        if (daysSinceSave < 7) {
          return data
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error("Error loading saved progress:", error)
    }
    return null
  }

  const savedProgress = loadSavedProgress()

  const [currentStep, setCurrentStep] = useState<Step>(savedProgress?.currentStep || 1)
  const [voiceName, setVoiceName] = useState(savedProgress?.voiceName || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(savedProgress?.selectedFileUrl || null)
  const [uploadMethod, setUploadMethod] = useState<"upload" | "record">(savedProgress?.uploadMethod || "upload")
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<string | null>(savedProgress?.recordedAudio || null)
  const [recordedDuration, setRecordedDuration] = useState(savedProgress?.recordedDuration || 0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [totalRecordingTime, setTotalRecordingTime] = useState(savedProgress?.totalRecordingTime || 0)
  const [savedRecordings, setSavedRecordings] = useState<Array<{ url: string; duration: number; timestamp: number; removeBackgroundNoise?: boolean }>>(savedProgress?.savedRecordings || [])
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingRecordingIndex, setPlayingRecordingIndex] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(savedProgress?.clonedVoiceId || null)
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState("")
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [instantVoiceId, setInstantVoiceId] = useState<string | null>(savedProgress?.instantVoiceId || null)
  const [saveVoiceName, setSaveVoiceName] = useState(savedProgress?.saveVoiceName || "")
  const [saveVoiceTags, setSaveVoiceTags] = useState<string[]>(savedProgress?.saveVoiceTags || [])
  const [saveVoiceDescription, setSaveVoiceDescription] = useState(savedProgress?.saveVoiceDescription || "")
  const [clonePreviewUrls, setClonePreviewUrls] = useState<Record<string, string>>(savedProgress?.clonePreviewUrls || {})
  const [isCreatingInstantVoice, setIsCreatingInstantVoice] = useState(false)
  const [originalAudioElement, setOriginalAudioElement] = useState<HTMLAudioElement | null>(null)
  const [cloneAudioElement, setCloneAudioElement] = useState<HTMLAudioElement | null>(null)
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false)
  const [isPlayingClone, setIsPlayingClone] = useState(false)
  const [selectedPreviewLanguage, setSelectedPreviewLanguage] = useState<string>("en")
  const [removeBackgroundNoise, setRemoveBackgroundNoise] = useState(savedProgress?.removeBackgroundNoise || false)
  
  // Ref to store the progress interval so we can clear it on reset
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  // Ref to store the timeout so we can clear it on reset
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const originalAudioRef = useRef<HTMLAudioElement | null>(null)
  const cloneAudioRef = useRef<HTMLAudioElement | null>(null)
  const recordingStartTimeRef = useRef<number>(0)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Format time in MM:SS - memoized to avoid recreating on every render
  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "0:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Start recording - memoized with useCallback
  const startRecording = useCallback(async () => {
    try {
      setShowRecordingModal(true)
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingTime(0)
      recordingStartTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (recordingTime > 0 && isFinite(recordingTime) && !isNaN(recordingTime)) {
          setRecordedDuration(recordingTime)
        }
        
        const audio = new Audio(audioUrl)
        audio.onloadedmetadata = () => {
          const duration = (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) 
            ? audio.duration 
            : recordingTime
          if (isFinite(duration) && !isNaN(duration) && duration > 0) {
            setRecordedDuration(duration)
          } else if (recordingTime > 0 && isFinite(recordingTime) && !isNaN(recordingTime)) {
            setRecordedDuration(recordingTime)
          }
        }
        
        setRecordedAudio(audioUrl)
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
        setSelectedFile(audioFile)
        const blobUrl = URL.createObjectURL(audioBlob)
        setSelectedFileUrl(blobUrl)
        
        stream.getTracks().forEach(track => track.stop())
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Error accessing microphone:", error)
      }
      setShowRecordingModal(false)
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record your voice.",
        variant: "destructive"
      })
    }
  }, [toast])

  // Stop recording - memoized with useCallback
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  // Save current recording - memoized with useCallback
  const saveRecording = useCallback(() => {
    if (recordedAudio) {
      const duration = (recordedDuration && isFinite(recordedDuration) && !isNaN(recordedDuration) && recordedDuration > 0)
        ? recordedDuration
        : recordingTime
      
      if (duration > 0) {
        const newRecording = {
          url: recordedAudio,
          duration: duration,
          timestamp: Date.now(),
          removeBackgroundNoise: removeBackgroundNoise,
        }
        setSavedRecordings(prev => [...prev, newRecording])
      setTotalRecordingTime(prev => prev + duration)
      // Reset the toggle after saving recording
      setRemoveBackgroundNoise(false)
        
        setRecordedAudio(null)
        setSelectedFile(null)
        setRecordedDuration(0)
        setRecordingTime(0)
        setIsRecording(false)
        
        toast({
          title: "Recording Saved",
          description: `Saved ${formatTime(duration)} of audio. Total: ${formatTime(totalRecordingTime + duration)} / ${formatTime(60)}`,
        })
      }
    }
  }, [recordedAudio, recordedDuration, recordingTime, totalRecordingTime, formatTime, toast])

  // Delete recording - memoized with useCallback
  const deleteRecording = useCallback(() => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio)
    }
    setRecordedAudio(null)
    setSelectedFile(null)
    setRecordedDuration(0)
    setRecordingTime(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [recordedAudio])

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear saved file URL when new file is selected
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl)
      setSelectedFileUrl(null)
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFileError("")
      
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm']
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4|webm)$/i)) {
        setFileError("Please upload MP3 (192kbps+), WAV, M4A, or WebM file")
        return
      }
      
      if (file.size > 25 * 1024 * 1024) {
        setFileError("File size must be less than 25MB")
        return
      }
      
      const audioUrl = URL.createObjectURL(file)
      const audio = new Audio(audioUrl)
      audio.onloadedmetadata = () => {
        const duration = audio.duration
        if (duration < 10) {
          setFileError("Audio should be at least 10 seconds. Record a total of 60 seconds (1 minute) across all recordings.")
          URL.revokeObjectURL(audioUrl)
          return
        }
        if (duration > 300) {
          setFileError("Audio should be no longer than 3 minutes. Record a total of 60 seconds (1 minute) for best results.")
          URL.revokeObjectURL(audioUrl)
          return
        }
        setSelectedFile(file)
        setSelectedFileUrl(audioUrl)
        setRecordedAudio(audioUrl)
        setRecordedDuration(duration)
      }
      audio.onerror = () => {
        setFileError("Could not load audio file. Please check the file format.")
        URL.revokeObjectURL(audioUrl)
      }
      audio.load()
    }
  }

  // Reset processing state and clear intervals
  const resetProcessingState = () => {
    // Clear the progress interval if it exists
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    // Clear the timeout if it exists
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
    setIsCreatingInstantVoice(false)
    setProcessingProgress(0)
    setIsProcessing(false)
  }

  // Create Instant Voice clone
  const handleCreateInstantVoice = async () => {
    if (isDemoMode()) {
      setIsCreatingInstantVoice(true)
      setProcessingProgress(0)
      window.setTimeout(() => setProcessingProgress(55), 250)
      window.setTimeout(() => {
        const voice = createDemoVoice()
        setInstantVoiceId(voice.id)
        setClonedVoiceId(voice.id)
        setProcessingProgress(100)
        setCurrentStep(4)
        setIsCreatingInstantVoice(false)
        toast({ title: "Demo Voice ready", description: "This is a local simulation. Browser speech is used for narration; no audio was uploaded or saved." })
      }, 650)
      return
    }
    const fileToUse = selectedFile || (savedRecordings.length > 0 ? await combineRecordings() : null)
    
    if (!fileToUse) {
      toast({
        title: "Missing Audio",
        description: "Please upload or record audio first.",
        variant: "destructive"
      })
      return
    }

    setIsCreatingInstantVoice(true)
    setProcessingProgress(0)

    try {
      // Clear any existing interval and timeout
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }

      // Set a timeout to automatically reset if processing takes too long (60 seconds)
      processingTimeoutRef.current = setTimeout(() => {
        resetProcessingState()
        toast({
          title: "Processing Timeout",
          description: "The voice cloning process took too long. Please try again.",
          variant: "destructive"
        })
      }, 60000) // 60 seconds timeout

      // Start progress interval and store it in ref
      progressIntervalRef.current = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            return prev
          }
          return prev + 10
        })
      }, 500)

      // Determine if background noise removal should be enabled
      // If using uploaded file, use the main toggle
      // If using multiple recordings, use true if ANY recording has it enabled
      const shouldRemoveNoise = selectedFile 
        ? removeBackgroundNoise 
        : savedRecordings.some(r => r.removeBackgroundNoise === true)

      const formData = new FormData()
      formData.append("name", voiceName.trim() || "My Voice Clone")
      formData.append("audioFile", fileToUse)
      formData.append("removeBackgroundNoise", shouldRemoveNoise.toString())

      const response = await fetch("/api/voices/clone", {
        method: "POST",
        body: formData,
      })

      // Clear the progress interval and timeout
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
        processingTimeoutRef.current = null
      }
      setProcessingProgress(100)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to clone voice")
      }

      const voiceId = data.voice?.voiceId || data.voiceId
      setInstantVoiceId(voiceId)
      setClonedVoiceId(voiceId)
      
      // Generate preview samples in all languages
      await generateLanguagePreviews(voiceId)
      
      // Set preview URL from English
      if (clonePreviewUrls['en']) {
        setPreviewAudioUrl(clonePreviewUrls['en'])
      }
      
      setCurrentStep(4)
      toast({
        title: "Voice Cloned Successfully!",
        description: "Your voice clone is ready. Compare it with the original below.",
      })
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Clone error:", error)
      }
      toast({
        title: "Cloning Failed",
        description: error instanceof Error ? error.message : "Failed to clone voice. Please try again.",
        variant: "destructive"
      })
    } finally {
      resetProcessingState()
    }
  }

  // Cleanup intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
        processingTimeoutRef.current = null
      }
    }
  }, [])

  // Reset stuck processing state when entering step 3
  // This handles cases where the state might be stuck from a previous attempt (e.g., from cache)
  useEffect(() => {
    if (currentStep === 3) {
      // If we're on step 3 but not actively creating a voice and there's no cloned voice ID,
      // reset the processing state (might be stuck from a previous attempt or cache issue)
      const isStuck = !isCreatingInstantVoice && !clonedVoiceId && !instantVoiceId && processingProgress > 0
      if (isStuck) {
        // Reset after a short delay to avoid race conditions
        const timeoutId = setTimeout(() => {
          resetProcessingState()
        }, 100)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [currentStep, isCreatingInstantVoice, clonedVoiceId, instantVoiceId, processingProgress])

  // Initialize saveVoiceName when entering Step 4
  useEffect(() => {
    if (currentStep === 4 && !saveVoiceName && voiceName) {
      setSaveVoiceName(voiceName)
    }
  }, [currentStep, voiceName, saveVoiceName])

  // Combine saved recordings
  const combineRecordings = async (): Promise<File | null> => {
    if (savedRecordings.length === 0) return null
    
    try {
      const longestRecording = savedRecordings.reduce((prev, curr) => 
        curr.duration > prev.duration ? curr : prev
      )
      
      const response = await fetch(longestRecording.url)
      const blob = await response.blob()
      const file = new File([blob], 'combined-recording.webm', { type: 'audio/webm' })
      return file
    } catch (error) {
      console.error("Error combining recordings:", error)
      return null
    }
  }

  // Generate previews in all languages
  const generateLanguagePreviews = async (voiceId: string) => {
    const previewTexts: Record<string, string> = {
      'en': `Hello, this is ${voiceName || 'your cloned voice'} speaking in English.`,
      'es': `Hola, esta es ${voiceName || 'tu voz clonada'} hablando en español.`,
      'fr': `Bonjour, c'est ${voiceName || 'votre voix clonée'} qui parle en français.`,
      'zh': `你好，这是 ${voiceName || '你克隆的声音'} 用中文说话。`,
      'hi': `नमस्ते, यह ${voiceName || 'आपकी क्लोन की गई आवाज़'} हिंदी में बोल रही है।`,
    }

    const previews: Record<string, string> = {}
    
    for (const lang of SUPPORTED_LANGUAGES) {
      try {
        const response = await fetch("/api/voices/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voiceId,
            text: previewTexts[lang] || previewTexts['en'],
            language: ELEVENLABS_LANGUAGE_MAP[lang] || "en",
          }),
        })

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          previews[lang] = audioUrl
        }
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error generating preview for ${lang}:`, error)
        }
      }
    }
    
    setClonePreviewUrls(previews)
  }

  // Setup original audio element - use recordedAudio or selectedFileUrl
  useEffect(() => {
    const audioSource = recordedAudio || selectedFileUrl
    if (audioSource) {
      // Validate blob URL if it's a blob URL
      if (audioSource.startsWith('blob:')) {
        try {
          // Test if blob URL is still valid by creating a request
          fetch(audioSource, { method: 'HEAD' }).catch(() => {
            // Blob URL is invalid, don't proceed
            if (process.env.NODE_ENV === 'development') {
              console.warn("Blob URL is invalid or revoked")
            }
            return
          })
        } catch (e) {
          // Ignore fetch errors for blob URLs
        }
      }
      
      // Clean up previous audio
      if (originalAudioRef.current) {
        originalAudioRef.current.pause()
        originalAudioRef.current.src = ""
        originalAudioRef.current.onerror = null
        originalAudioRef.current.onended = null
      }
      
      try {
        const audio = new Audio()
        audio.preload = "auto"
        // Don't set crossOrigin for blob URLs as it causes security errors
        if (!audioSource.startsWith('blob:')) {
          audio.crossOrigin = "anonymous"
        }
        
        // Set up event handlers before setting src
        audio.onended = () => {
          setIsPlayingOriginal(false)
        }
        audio.onerror = (e) => {
          setIsPlayingOriginal(false)
          if (process.env.NODE_ENV === 'development') {
            console.error("Original audio playback error:", e, audio.error)
          }
          toast({
            title: "Audio Error",
            description: "Unable to load audio. Please try again or re-upload the file.",
            variant: "destructive"
          })
        }
        audio.onloadeddata = () => {
          // Audio loaded successfully
        }
        audio.onloadstart = () => {
          // Audio loading started
        }
        
        // Set source after handlers are set up
        audio.src = audioSource
        originalAudioRef.current = audio
        setOriginalAudioElement(audio)
        
        return () => {
          if (audio) {
            audio.pause()
            audio.src = ""
            audio.onerror = null
            audio.onended = null
            audio.onloadeddata = null
            audio.onloadstart = null
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error creating audio element:", error)
        }
        toast({
          title: "Audio Error",
          description: "Unable to initialize audio player. Please try again.",
          variant: "destructive"
        })
      }
    } else {
      if (originalAudioRef.current) {
        originalAudioRef.current.pause()
        originalAudioRef.current.src = ""
        originalAudioRef.current.onerror = null
        originalAudioRef.current.onended = null
      }
      setOriginalAudioElement(null)
    }
  }, [recordedAudio, selectedFileUrl, toast])

  // Setup clone audio element
  useEffect(() => {
    if (clonePreviewUrls[selectedPreviewLanguage]) {
      // Clean up previous audio
      if (cloneAudioRef.current) {
        cloneAudioRef.current.pause()
        cloneAudioRef.current.src = ""
      }
      
      const audio = new Audio(clonePreviewUrls[selectedPreviewLanguage])
      audio.onended = () => setIsPlayingClone(false)
      audio.onerror = () => setIsPlayingClone(false)
      cloneAudioRef.current = audio
      setCloneAudioElement(audio)
      
      return () => {
        audio.pause()
        audio.src = ""
      }
    } else {
      if (cloneAudioRef.current) {
        cloneAudioRef.current.pause()
        cloneAudioRef.current.src = ""
      }
      setCloneAudioElement(null)
    }
  }, [clonePreviewUrls, selectedPreviewLanguage])

  // Handle original audio play/pause - memoized with useCallback
  const handleOriginalPlayPause = useCallback(async () => {
    const audio = originalAudioRef.current || originalAudioElement
    if (!audio) return
    
    try {
      if (isPlayingOriginal) {
        audio.pause()
        setIsPlayingOriginal(false)
      } else {
        await audio.play()
        setIsPlayingOriginal(true)
      }
    } catch (error) {
      // Only log in development to avoid exposing errors in production
      if (process.env.NODE_ENV === 'development') {
        console.error("Playback error:", error)
      }
      // Provide user feedback for playback errors
      toast({
        title: "Playback Error",
        description: "Unable to play audio. Please try again.",
        variant: "destructive"
      })
    }
  }, [isPlayingOriginal, originalAudioElement, toast])

  // Handle clone audio play/pause - memoized with useCallback
  const handleClonePlayPause = useCallback(async () => {
    if (!cloneAudioRef.current) return
    
    try {
      if (isPlayingClone) {
        cloneAudioRef.current.pause()
        setIsPlayingClone(false)
      } else {
        await cloneAudioRef.current.play()
        setIsPlayingClone(true)
      }
    } catch (error) {
      // Only log in development to avoid exposing errors in production
      if (process.env.NODE_ENV === 'development') {
        console.error("Playback error:", error)
      }
      // Provide user feedback for playback errors
      toast({
        title: "Playback Error",
        description: "Unable to play audio. Please try again.",
        variant: "destructive"
      })
    }
  }, [isPlayingClone, toast])

  // Save voice to library
  const handleSaveVoice = async () => {
    if (!saveVoiceName.trim() || !instantVoiceId) {
      toast({
        title: "Missing Information",
        description: "Please provide a voice name.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/voices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: instantVoiceId,
          name: saveVoiceName,
          tags: saveVoiceTags,
          description: saveVoiceDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to save voice")
      }

      toast({
        title: "Voice Saved!",
        description: "Your voice has been added to your library and is ready to use in stories.",
      })

      setCurrentStep(5)
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Save error:", error)
      }
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save voice. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset form
  const handleReset = () => {
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
    
    // Revoke blob URLs
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl)
    }
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio)
    }
    savedRecordings.forEach(rec => {
      if (rec.url.startsWith('blob:')) {
        URL.revokeObjectURL(rec.url)
      }
    })
    
    setCurrentStep(1)
    setVoiceName("")
    setSelectedFile(null)
    setSelectedFileUrl(null)
    setUploadMethod("upload")
    setRecordedAudio(null)
    setRecordedDuration(0)
    setRecordingTime(0)
    setTotalRecordingTime(0)
    setSavedRecordings([])
    setClonedVoiceId(null)
    setPreviewAudioUrl(null)
    setInstantVoiceId(null)
    setSaveVoiceName("")
    setSaveVoiceTags([])
    setSaveVoiceDescription("")
    setClonePreviewUrls({})
    setFileError("")
    setIsProcessing(false)
    setIsCreatingInstantVoice(false)
    setProcessingProgress(0)
    if (originalAudioRef.current) {
      originalAudioRef.current.pause()
      originalAudioRef.current.src = ""
    }
    if (cloneAudioRef.current) {
      cloneAudioRef.current.pause()
      cloneAudioRef.current.src = ""
    }
    setIsPlayingOriginal(false)
    setIsPlayingClone(false)
  }

  // Save progress to localStorage - memoized with useCallback
  const saveProgress = useCallback(() => {
    if (isDemoMode()) return
    if (typeof window === "undefined") return
    
    try {
      const progress: SavedProgress = {
        currentStep,
        voiceName,
        selectedFileUrl: selectedFileUrl || undefined,
        selectedFileName: selectedFile?.name || undefined,
        uploadMethod,
        recordedAudio: recordedAudio || undefined,
        recordedDuration,
        totalRecordingTime,
        savedRecordings,
        clonedVoiceId,
        instantVoiceId,
        saveVoiceName,
        saveVoiceTags,
        saveVoiceDescription,
        clonePreviewUrls,
        removeBackgroundNoise,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Error saving progress:", error)
      }
    }
  }, [
    currentStep,
    voiceName,
    selectedFileUrl,
    uploadMethod,
    recordedAudio,
    recordedDuration,
    totalRecordingTime,
    savedRecordings,
    clonedVoiceId,
    instantVoiceId,
    saveVoiceName,
    saveVoiceTags,
    saveVoiceDescription,
    clonePreviewUrls,
    removeBackgroundNoise,
  ])

  // Save progress whenever relevant state changes
  useEffect(() => {
    saveProgress()
  }, [saveProgress])

  // Note: We can't restore File objects from localStorage, only URLs
  // If a blob URL was saved, it will be expired when the page reloads
  // The user will need to re-upload the file, but we can restore other state

  // Calculate overall progress across all steps - memoized for performance
  const overallProgress = useMemo(() => {
    let progress = 0
    
    // Step 1: Name (20%)
    if (voiceName.trim()) {
      progress += 20
    }
    
    // Step 2: Audio (20%)
    if (selectedFile || selectedFileUrl || recordedAudio || totalRecordingTime >= 60) {
      progress += 20
    } else if (totalRecordingTime > 0) {
      // Partial progress for recording
      progress += (totalRecordingTime / 60) * 20
    }
    
    // Step 3: Processing (20%)
    if (clonedVoiceId) {
      progress += 20
    } else if (isProcessing) {
      // Show processing progress
      progress += (processingProgress / 100) * 20
    }
    
    // Step 4: Compare (20%)
    if (clonedVoiceId && currentStep >= 4) {
      progress += 20
    }
    
    // Step 5: Save (20%)
    if (saveVoiceName.trim() && currentStep === 5) {
      progress += 20
    }
    
    return Math.min(100, Math.round(progress))
  }, [
    voiceName,
    selectedFile,
    selectedFileUrl,
    recordedAudio,
    totalRecordingTime,
    clonedVoiceId,
    isProcessing,
    processingProgress,
    currentStep,
    saveVoiceName
  ])

  // Get current step progress percentage (for display in step indicator)
  // Calculate step progress - memoized for performance
  const stepProgress = useMemo(() => {
    switch (currentStep) {
      case 1: return voiceName.trim() ? 100 : 0
      case 2: {
        const hasAudio = selectedFile || selectedFileUrl || recordedAudio || totalRecordingTime >= 60
        return hasAudio ? 100 : (totalRecordingTime / 60) * 100
      }
      case 3: return processingProgress
      case 4: return clonedVoiceId ? 100 : 0
      case 5: return saveVoiceName.trim() ? 100 : 0
      default: return 0
    }
  }, [currentStep, voiceName, selectedFile, selectedFileUrl, recordedAudio, totalRecordingTime, processingProgress, clonedVoiceId, saveVoiceName])

  // Memoize computed values for performance
  const canProceedToStep2 = useMemo(() => voiceName.trim().length > 0, [voiceName])
  const canProceedToStep3 = useMemo(() => 
    (selectedFile || recordedAudio || totalRecordingTime >= 60) && !isCreatingInstantVoice,
    [selectedFile, recordedAudio, totalRecordingTime, isCreatingInstantVoice]
  )
  const isStep3Complete = useMemo(() => clonedVoiceId !== null, [clonedVoiceId])
  const canProceedToStep5 = useMemo(() => saveVoiceName.trim().length > 0, [saveVoiceName])

  return (
    <div className="w-full space-y-8 sm:space-y-12">
      {isDemoMode() && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Demo simulation only: recording and uploaded audio stay in this browser session and are never uploaded or saved. Creating Demo Voice stores only its local metadata and uses browser speech for narration.</AlertDescription>
        </Alert>
      )}
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep} of 5</span>
          <span>{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" aria-label={`Overall progress: ${overallProgress}%`} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={voiceName.trim() ? "text-foreground font-medium" : ""}>Name</span>
          <span className={selectedFile || selectedFileUrl || recordedAudio || totalRecordingTime >= 60 ? "text-foreground font-medium" : ""}>Audio</span>
          <span className={clonedVoiceId ? "text-foreground font-medium" : ""}>Processing</span>
          <span className={clonedVoiceId && currentStep >= 4 ? "text-foreground font-medium" : ""}>Compare</span>
          <span className={saveVoiceName.trim() && currentStep === 5 ? "text-foreground font-medium" : ""}>Save</span>
        </div>
      </div>

      {/* Step 1: Name Your Voice */}
      {currentStep === 1 && (
        <Card className="glass-card border border-border/50">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Step 1 of 5
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Name Your Voice
                </h2>
                <p className="text-base text-muted-foreground">
                  Give your voice clone a name so you can easily identify it later.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voiceName" className="text-base font-semibold">
                  Voice Name
                </Label>
                <Input
                  id="voiceName"
                  placeholder="e.g., Grandma Sarah, Uncle Mike, My Voice..."
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="h-12 text-base"
                  aria-required="true"
                  aria-label="Voice name input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canProceedToStep2) {
                      e.preventDefault()
                      setCurrentStep(2)
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  This name will appear in your voice library
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep2}
                  size="lg"
                  className="gap-2 min-h-[44px]"
                  aria-label={canProceedToStep2 ? "Continue to next step" : "Please enter a voice name to continue"}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Provide Audio */}
      {currentStep === 2 && (
        <Card className="glass-card border border-border/50">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Step 2 of 5
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Provide Audio
                </h2>
                <p className="text-base text-muted-foreground">
                  Upload an audio file or record your voice. You need at least 60 seconds of clear audio for best results.
                </p>
              </div>

              {/* Method Selection */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={uploadMethod === "upload" ? "default" : "outline"}
                  onClick={() => {
                    setUploadMethod("upload")
                    stopRecording()
                  }}
                  className="flex-1 h-12 min-h-[44px]"
                  disabled={isProcessing || isRecording}
                  aria-label="Upload audio file"
                  aria-pressed={uploadMethod === "upload"}
                >
                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === "record" ? "default" : "outline"}
                  onClick={() => {
                    setUploadMethod("record")
                    setSelectedFile(null)
                    setRecordedAudio(null)
                  }}
                  className="flex-1 h-12 min-h-[44px]"
                  disabled={isProcessing || isRecording}
                  aria-label="Record audio"
                  aria-pressed={uploadMethod === "record"}
                >
                  <Mic className="h-4 w-4 mr-2" aria-hidden="true" />
                  Record
                </Button>
              </div>

              {/* Total Recording Time Display */}
              {uploadMethod === "record" && (totalRecordingTime > 0 || savedRecordings.length > 0) && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Recording Progress</span>
                    <span className="text-sm font-semibold">{formatTime(totalRecordingTime)} / {formatTime(60)}</span>
                  </div>
                  <Progress 
                    value={Math.min((totalRecordingTime / 60) * 100, 100)} 
                    className="h-3" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {totalRecordingTime >= 60 
                      ? "✓ Ready to create your Instant Voice clone!" 
                      : `Continue recording to reach ${formatTime(60)} total (${formatTime(60 - totalRecordingTime)} remaining)`}
                  </p>
                </div>
              )}

              {/* Upload Section */}
              {uploadMethod === "upload" && (
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors min-h-[44px]"
                    onClick={() => !isProcessing && document.getElementById("audio-upload")?.click()}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
                        e.preventDefault()
                        document.getElementById("audio-upload")?.click()
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload audio file - click or press Enter to browse"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-base font-medium mb-1">Drop an audio file here or click to browse</p>
                        <p className="text-sm text-muted-foreground">
                          MP3 (128kbps+), WAV, or M4A • At least 60 seconds • Max 25MB
                        </p>
                      </div>
                    </div>
                    <input
                      id="audio-upload"
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/mp4,audio/m4a,audio/webm"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isProcessing}
                      aria-label="Audio file upload input"
                    />
                  </div>

                  {/* Uploaded File Display with Enhanced Audio Player */}
                  {selectedFile && recordedAudio && (
                    <Card className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{selectedFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(recordedDuration)} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={deleteRecording}
                              aria-label="Remove uploaded file"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                          {originalAudioElement && (
                            <EnhancedAudioPlayer
                              audio={originalAudioElement}
                              audioUrl={recordedAudio}
                              isPlaying={isPlayingOriginal}
                              onPlayPause={handleOriginalPlayPause}
                              showActions={false}
                            />
                          )}
                          <audio
                            ref={originalAudioRef}
                            src={recordedAudio}
                            className="hidden"
                            onEnded={() => setIsPlayingOriginal(false)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Record Section */}
              {uploadMethod === "record" && (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center gap-4">
                        {!isRecording ? (
                          <Button
                            onClick={startRecording}
                            disabled={isProcessing}
                            className="h-16 w-16 rounded-full min-h-[64px] min-w-[64px]"
                            size="icon"
                            aria-label={isRecording ? "Stop recording" : "Start recording audio"}
                            aria-pressed={isRecording}
                          >
                            <Mic className="h-6 w-6" aria-hidden="true" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={stopRecording}
                              variant="destructive"
                              className="h-16 w-16 rounded-full animate-pulse min-h-[64px] min-w-[64px]"
                              size="icon"
                              aria-label="Stop recording audio"
                            >
                              <MicOff className="h-6 w-6" aria-hidden="true" />
                            </Button>
                            <div className="w-full space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Recording: {formatTime(recordingTime)}</span>
                                <span className="text-muted-foreground">Target: 60s</span>
                              </div>
                  <Progress 
                    value={Math.min((recordingTime / 60) * 100, 100)} 
                    className="h-3"
                    aria-label={`Recording progress: ${Math.round((recordingTime / 60) * 100)}%`}
                  />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Recording Display */}
                  {recordedAudio && !isRecording && (
                    <Card className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Current Recording</p>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(recordedDuration || recordingTime)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={saveRecording}
                                className="gap-2"
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={deleteRecording}
                                aria-label="Delete recording"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {originalAudioElement && recordedAudio && (
                            <EnhancedAudioPlayer
                              audio={originalAudioElement}
                              audioUrl={recordedAudio}
                              isPlaying={isPlayingOriginal}
                              onPlayPause={handleOriginalPlayPause}
                              showActions={false}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Saved Recordings List */}
                  {savedRecordings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Saved Recordings ({savedRecordings.length})</p>
                      {savedRecordings.map((recording, index) => (
                        <Card key={index} className="border border-border/50">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Recording {index + 1} • {formatTime(recording.duration)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const recordingToDelete = savedRecordings[index]
                                    URL.revokeObjectURL(recordingToDelete.url)
                                    setSavedRecordings(prev => {
                                      const newRecordings = prev.filter((_, i) => i !== index)
                                      const newTotal = newRecordings.reduce((sum, r) => sum + r.duration, 0)
                                      setTotalRecordingTime(newTotal)
                                      return newRecordings
                                    })
                                  }}
                                  aria-label={`Delete recording ${index + 1}`}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>
                              {/* Per-recording background noise toggle */}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex-1">
                                  <Label htmlFor={`noise-suppression-${index}`} className="text-xs font-medium cursor-pointer">
                                    Remove background noise
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Enable only if this recording has background noise
                                  </p>
                                </div>
                                <Switch
                                  id={`noise-suppression-${index}`}
                                  checked={recording.removeBackgroundNoise || false}
                                  onCheckedChange={(checked) => {
                                    setSavedRecordings(prev => 
                                      prev.map((r, i) => 
                                        i === index ? { ...r, removeBackgroundNoise: checked } : r
                                      )
                                    )
                                  }}
                                  aria-label={`Remove background noise for recording ${index + 1}`}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {fileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
              )}

              {/* Background Noise Suppression Option */}
              {(selectedFile || savedRecordings.length > 0 || totalRecordingTime >= 60) && (
                <Card className="border border-border/50 bg-muted/30">
                  <CardContent className="p-4 sm:p-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Label htmlFor="noise-suppression" className="text-base font-semibold cursor-pointer">
                              Remove Background Noise
                            </Label>
                            <Switch
                              id="noise-suppression"
                              checked={removeBackgroundNoise}
                              onCheckedChange={setRemoveBackgroundNoise}
                              aria-label="Remove background noise"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {removeBackgroundNoise ? (
                              <>
                                <span className="font-medium">Enabled:</span> Background noise will be removed from your audio. Only enable this if your recording has noticeable background noise, as it may affect voice quality in clean recordings.
                              </>
                            ) : (
                              <>
                                <span className="font-medium">Disabled:</span> Your audio will be processed as-is. Keep this disabled if your recording is already clean and clear.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>Tip:</strong> Only enable background noise removal if you hear background noise, traffic, or other unwanted sounds in your recording. For clean, quiet recordings, leave this disabled to preserve the best voice quality.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep(3)
                    handleCreateInstantVoice()
                  }}
                  disabled={!canProceedToStep3}
                  size="lg"
                  className="gap-2"
                >
                  {isCreatingInstantVoice ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Create Voice Clone
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Processing */}
      {currentStep === 3 && (
        <Card className="glass-card border border-border/50">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Step 3 of 5
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Creating Your Voice Clone
                </h2>
                <p className="text-base text-muted-foreground">
                  Our AI is analyzing your voice and creating a digital replica. This may take a few moments.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing...</span>
                  <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                </div>
                <Progress 
                  value={processingProgress} 
                  className="h-3"
                  aria-label={`Processing progress: ${processingProgress}%`}
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>This may take a few moments</span>
                </div>
              </div>

              {/* Reset button - always show on step 3 so user can reset if stuck */}
              <div className="flex flex-col items-center gap-3 pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  {isCreatingInstantVoice 
                    ? "If processing seems stuck, you can reset and try again."
                    : "If you need to start over, you can reset and go back to step 2."}
                </p>
                <Button
                  onClick={() => {
                    resetProcessingState()
                    setCurrentStep(2) // Go back to step 2 so user can try again
                    toast({
                      title: "Processing Reset",
                      description: "You can try again by clicking 'Create Voice Clone' again.",
                    })
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset & Try Again
                </Button>
              </div>

              {isStep3Complete && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setCurrentStep(4)}
                    size="lg"
                    className="gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Compare Original vs Clone */}
      {currentStep === 4 && clonedVoiceId && (
        <Card className="glass-card border border-border/50">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Step 4 of 5
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Compare Your Voice
                </h2>
                <p className="text-base text-muted-foreground">
                  Listen to your original voice and compare it with the AI-generated clone. Try different languages to hear how your voice sounds in each.
                </p>
              </div>

              {/* Original vs Clone Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Original Voice */}
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Original</div>
                  <div className="glass-card border border-border/50 rounded-xl p-4 sm:p-6 space-y-4 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
                        <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base sm:text-lg truncate">{voiceName || "Original Voice"}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Original</div>
                      </div>
                    </div>
                    {originalAudioElement && (recordedAudio || selectedFileUrl) ? (
                      <div className="w-full overflow-hidden" role="region" aria-label="Original audio player">
                        <EnhancedAudioPlayer
                          audio={originalAudioElement}
                          audioUrl={recordedAudio || selectedFileUrl || ""}
                          isPlaying={isPlayingOriginal}
                          onPlayPause={handleOriginalPlayPause}
                          showActions={false}
                        />
                      </div>
                    ) : (
                      <div className="w-full p-4 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
                        No audio available
                      </div>
                    )}
                  </div>
                </div>

                {/* Cloned Voice */}
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Voice Clone</div>
                  <div className="glass-card border border-border/50 rounded-xl p-4 sm:p-6 space-y-4 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                        <Volume2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base sm:text-lg truncate">{saveVoiceName || voiceName || "Cloned Voice"}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Clone</div>
                      </div>
                    </div>
                    {cloneAudioElement && clonePreviewUrls[selectedPreviewLanguage] ? (
                      <div className="w-full overflow-hidden" role="region" aria-label="Cloned voice audio player">
                        <EnhancedAudioPlayer
                          audio={cloneAudioElement}
                          audioUrl={clonePreviewUrls[selectedPreviewLanguage]}
                          isPlaying={isPlayingClone}
                          onPlayPause={handleClonePlayPause}
                          showActions={false}
                        />
                      </div>
                    ) : (
                      <div className="w-full p-4 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
                        Generating preview...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Language Selection for Clone Preview */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Preview Clone in Different Languages</Label>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Language selection for voice preview">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const langData = getLanguageData(lang)
                    const flag = getLanguageFlag(lang)
                    const name = langData?.name || lang
                    const hasPreview = !!clonePreviewUrls[lang]
                    const isSelected = selectedPreviewLanguage === lang
                    
                    return (
                      <Button
                        key={lang}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedPreviewLanguage(lang)
                          setIsPlayingClone(false)
                          if (cloneAudioRef.current) {
                            cloneAudioRef.current.pause()
                          }
                        }}
                        disabled={!hasPreview}
                        className="rounded-full flex items-center gap-2 min-h-[44px]"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`Preview voice in ${name}${!hasPreview ? ' (generating)' : ''}`}
                      >
                        <span className="text-base" aria-hidden="true">{flag}</span>
                        <span>{name}</span>
                        {!hasPreview && (
                          <Loader2 className="h-3 w-3 animate-spin ml-1" aria-hidden="true" />
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Voice Details - Name, Description, Tags */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="voice-name-step4" className="text-base font-semibold">
                    Voice Name *
                  </Label>
                  <Input
                    id="voice-name-step4"
                    value={saveVoiceName || voiceName || ""}
                    onChange={(e) => setSaveVoiceName(e.target.value)}
                    placeholder="e.g., My Voice, Mom's Voice"
                    className="h-12 text-base min-h-[44px]"
                    aria-required="true"
                    aria-label="Voice name for saving to library"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Family", "Educator", "Narrator"].map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={saveVoiceTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSaveVoiceTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          )
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voice-description-step4" className="text-base font-semibold">
                    Description (Optional)
                  </Label>
                  <textarea
                    id="voice-description-step4"
                    value={saveVoiceDescription}
                    onChange={(e) => setSaveVoiceDescription(e.target.value)}
                    placeholder="Add a description for this voice..."
                    className="w-full p-3 border rounded-lg min-h-[100px] resize-none text-base min-h-[44px]"
                    aria-label="Voice description (optional)"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    // Initialize saveVoiceName if not set
                    if (!saveVoiceName && voiceName) {
                      setSaveVoiceName(voiceName)
                    }
                    setCurrentStep(5)
                  }}
                  disabled={!saveVoiceName?.trim()}
                  size="lg"
                  className="gap-2 min-h-[44px]"
                  aria-label={saveVoiceName?.trim() ? "Continue to save voice to library" : "Please enter a voice name to continue"}
                >
                  Continue to Save
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Save to Library */}
      {currentStep === 5 && (
        <Card className="glass-card border border-border/50">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Step 5 of 5
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Save to Your Library
                </h2>
                <p className="text-base text-muted-foreground">
                  Add details to help you organize and find this voice in your library.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="save-voice-name" className="text-base font-semibold">
                    Voice Name *
                  </Label>
                  <Input
                    id="save-voice-name"
                    value={saveVoiceName}
                    onChange={(e) => setSaveVoiceName(e.target.value)}
                    placeholder={voiceName || "e.g., My Voice, Mom's Voice"}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Family", "Educator", "Narrator"].map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={saveVoiceTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSaveVoiceTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          )
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="save-voice-description" className="text-base font-semibold">
                    Description (Optional)
                  </Label>
                  <textarea
                    id="save-voice-description"
                    value={saveVoiceDescription}
                    onChange={(e) => setSaveVoiceDescription(e.target.value)}
                    placeholder="Add a description for this voice..."
                    className="w-full p-3 border rounded-lg min-h-[100px] resize-none text-base"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(4)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSaveVoice}
                  disabled={!canProceedToStep5 || isProcessing}
                  size="lg"
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save to Library
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {currentStep === 5 && !isProcessing && (
        <Card className="glass-card border border-green-500/50 bg-green-500/5">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Voice Saved Successfully!</h3>
                <p className="text-base text-muted-foreground mb-6">
                  Your voice clone has been added to your library and is ready to use in stories.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => window.location.href = '/voices'}
                    variant="default"
                    size="lg"
                    className="gap-2"
                  >
                    View Voice Library
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    Clone Another Voice
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Modal */}
      <Dialog open={showRecordingModal} onOpenChange={(open) => {
        if (!open && isRecording) {
          return
        }
        if (!open && recordedAudio) {
          if (confirm("Are you sure you want to close? Your current recording will be lost if not saved.")) {
            setShowRecordingModal(open)
          }
          return
        }
        setShowRecordingModal(open)
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Recording Script</DialogTitle>
            <DialogDescription>
              Read this script clearly and naturally. Record a total of 60 seconds (1 minute) of audio across all recordings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Recording Time</span>
                <span className="text-sm font-semibold">{formatTime(totalRecordingTime + recordingTime)} / {formatTime(60)}</span>
              </div>
              <Progress 
                value={Math.min(((totalRecordingTime + recordingTime) / 60) * 100, 100)} 
                className="h-3" 
              />
            </div>

            <div className="p-4 border rounded-lg bg-background">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{EXAMPLE_SCRIPT}</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  stopRecording()
                  setShowRecordingModal(false)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
