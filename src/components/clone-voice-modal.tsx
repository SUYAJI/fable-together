"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Users } from "lucide-react"

interface CloneVoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CloneVoiceModal({ open, onOpenChange }: CloneVoiceModalProps) {
  const [voiceName, setVoiceName] = useState("")
  const [role, setRole] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<"upload" | "record">("upload")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isCloning, setIsCloning] = useState(false)
  const [fileError, setFileError] = useState("")

  const availableRoles = [
    { value: "family", label: "Family Member" },
    { value: "narrator", label: "Story Narrator" },
    { value: "educator", label: "Educator" },
    { value: "character", label: "Character Voice" },
    { value: "announcer", label: "Announcer" }
  ]

  const availableTags = [
    "Friendly", "Calm", "Energetic", "Warm", "Professional", 
    "Playful", "Authoritative", "Gentle", "Expressive", "Clear"
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFileError("")
      
      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a']
      if (!allowedTypes.includes(file.type)) {
        setFileError("Please upload an MP3, WAV, or M4A file")
        return
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File size must be less than 10MB")
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const canSubmit = voiceName.trim() !== "" && role !== "" && selectedFile

  const handleSubmit = async () => {
    if (!canSubmit || !selectedFile) return
    
    setIsCloning(true)
    try {
      const formData = new FormData()
      formData.append("name", voiceName)
      formData.append("role", role)
      formData.append("tags", JSON.stringify(selectedTags))
      formData.append("audioFile", selectedFile)

      const response = await fetch("/api/voices/clone", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to clone voice")
      }

      // Success - close modal and show success message
      onOpenChange(false)
      alert("Voice cloned successfully!")
      
    } catch (error) {
      console.error("Voice cloning error:", error)
      alert(error instanceof Error ? error.message : "Failed to clone voice")
    } finally {
      setIsCloning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 w-[95vw] sm:w-full animate-scale-in">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Clone Your Voice</h2>
            <button onClick={() => onOpenChange(false)} className="btn-ghost rounded-lg p-2 min-h-[44px] min-w-[44px] touch-manipulation">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Descriptive Text */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Create Your Digital Voice</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Create a digital clone of your voice to use in stories. Record ~2 minutes of clear speech or
              upload an audio sample. Your voice will be available for use in all your stories.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label htmlFor="voiceName" className="text-sm sm:text-base font-semibold">
                Voice Name
              </label>
              <input
                id="voiceName"
                placeholder="e.g., Grandma Sarah, Uncle Mike, My Voice..."
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="input-field w-full h-12 sm:h-14 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm sm:text-base font-semibold">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field w-full h-12 sm:h-14 text-sm sm:text-base bg-white"
              >
                <option value="">Select a role</option>
                {availableRoles.map((roleOption) => (
                  <option key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Tags */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base font-semibold">Voice Characteristics (Optional)</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-full text-xs sm:text-sm transition-colors min-h-[44px] touch-manipulation ${
                      selectedTags.includes(tag)
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setUploadMethod("upload")}
                className={`flex-1 h-12 sm:h-14 text-sm sm:text-base gap-2 rounded-lg flex items-center justify-center min-h-[44px] touch-manipulation ${
                  uploadMethod === "upload"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-900 hover:bg-neutral-50 border border-neutral-300"
                }`}
              >
                📤 Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod("record")}
                className={`flex-1 h-12 sm:h-14 text-sm sm:text-base gap-2 rounded-lg flex items-center justify-center min-h-[44px] touch-manipulation ${
                  uploadMethod === "record"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-900 hover:bg-neutral-50 border border-neutral-300"
                }`}
              >
                🎤 Record
              </button>
            </div>

            {uploadMethod === "upload" && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 md:p-16 text-center cursor-pointer hover:border-gray-400 transition-colors min-h-[120px] sm:min-h-[200px] flex items-center justify-center"
                onClick={() => document.getElementById("audio-upload")?.click()}
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="text-3xl sm:text-4xl md:text-5xl">📤</div>
                  <div>
                    <p className="text-sm sm:text-base text-gray-700 mb-1">Drop an audio file here or click to browse</p>
                    <p className="text-xs sm:text-sm text-gray-500">MP3, WAV, or M4A (max 10MB, 30s-5min)</p>
                  </div>
                </div>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/mp4,audio/m4a"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {uploadMethod === "record" && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 md:p-16 text-center min-h-[120px] sm:min-h-[200px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="text-3xl sm:text-4xl md:text-5xl">🎤</div>
                  <div>
                    <p className="text-sm sm:text-base text-gray-700 mb-1">Recording functionality coming soon</p>
                    <p className="text-xs sm:text-sm text-gray-500">Please use the upload option for now</p>
                  </div>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                </p>
              </div>
            )}

            {fileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{fileError}</p>
              </div>
            )}

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Voice cloning requires a clear 30-60 second sample. The quality of your sample determines the voice clone
              quality.
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-sm sm:text-base px-4 sm:px-8 h-11 sm:h-12 hover:bg-gray-100 rounded-lg min-h-[44px] touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isCloning}
                className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base ${
                  canSubmit && !isCloning
                    ? "bg-neutral-900 text-white hover:bg-neutral-800"
                    : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {isCloning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {isCloning ? "Cloning Voice..." : "Clone Voice"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
