"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import { LANGUAGE_NAMES } from "@/lib/language-codes";
import { createBrowserNarration } from "@/lib/browser-narration";

interface VoicePreviewProps {
  voiceId: string;
  voiceName: string;
  className?: string;
  language?: string;
  previewText?: string;
}

// Preview text for each language
const getPreviewText = (language: string, voiceName: string): string => {
  const texts: Record<string, string> = {
    en: `Hello, this is a preview of ${voiceName}`,
    es: `Hola, esta es una vista previa de ${voiceName}`,
    fr: `Bonjour, ceci est un aperçu de ${voiceName}`,
    zh: `你好，这是 ${voiceName} 的预览`,
    hi: `नमस्ते, यह ${voiceName} का पूर्वावलोकन है`,
  };
  return texts[language] || texts.en;
};

// Get full language label for button text
const getLanguageLabel = (language: string): string => {
  return LANGUAGE_NAMES[language] || language;
};

export const VoicePreview = memo(function VoicePreview({ 
  voiceId, 
  voiceName, 
  className,
  language = "en",
  previewText
}: VoicePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audioUrl, audio]);

  const handlePreview = useCallback(async () => {
    if (isPlaying) {
      // Stop current audio
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      } else if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      // Play existing audio
      const audioElement = new Audio(audioUrl);
      audioElement.onended = () => setIsPlaying(false);
      audioElement.play();
      setAudio(audioElement);
      setIsPlaying(true);
      return;
    }

    // Generate new preview
    setIsLoading(true);
    try {
      const response = await fetch("/api/voices/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceId,
          text: previewText || getPreviewText(language, voiceName),
          language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate preview: ${response.status} ${errorText}`);
      }

      if (response.headers.get("content-type")?.includes("application/json")) {
        const preview = await response.json();
        if (preview.playback === "browser-speech") {
          const utterance = createBrowserNarration(preview.text, 1);
          if (!utterance) throw new Error("Browser narration is unavailable");
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
          setIsPlaying(true);
          return;
        }
      }

      // API returns binary audio data, not JSON
      const audioBlob = await response.blob();
      const newAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newAudioUrl);

      // Play the audio
      const audioElement = new Audio(newAudioUrl);
      audioElement.onended = () => {
        setIsPlaying(false);
        // Clean up the blob URL when audio ends
        URL.revokeObjectURL(newAudioUrl);
        setAudioUrl(null);
      };
      audioElement.onerror = (e) => {
        // Log errors for debugging, but don't show alert
        // The onerror event can fire even when audio plays successfully
        console.warn("Audio element error event (may be non-critical):", e);
        // Don't clean up immediately - let the audio try to play
        // Only clean up if there's an actual error after play attempt
      };
      
      try {
        await audioElement.play();
        setAudio(audioElement);
        setIsPlaying(true);
      } catch (playError) {
        // Only show error if play() promise actually rejects
        console.error("Error playing audio:", playError);
        setIsLoading(false);
        URL.revokeObjectURL(newAudioUrl);
        setAudioUrl(null);
        // Don't show alert - let the user try again silently
      }
    } catch (error) {
      console.error("Error generating voice preview:", error);
      alert(error instanceof Error ? error.message : "Failed to generate voice preview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [voiceId, voiceName, language, previewText, isPlaying, audioUrl, audio]);

  const buttonText = isLoading 
    ? "Loading..." 
    : isPlaying 
    ? "Stop" 
    : `Preview (${getLanguageLabel(language)})`;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePreview}
      disabled={isLoading}
      className={`gap-1.5 text-xs sm:text-sm ${className || ""}`}
      title={LANGUAGE_NAMES[language] || language}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
      ) : isPlaying ? (
        <Pause className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
      ) : (
        <Play className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
      )}
      <span className="whitespace-normal text-left">
        {buttonText}
      </span>
    </Button>
  );
});
