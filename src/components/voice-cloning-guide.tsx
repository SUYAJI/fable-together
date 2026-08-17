"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Upload, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Volume2,
  FileAudio,
  User,
  BookOpen,
} from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Choose Your Method",
    description: "You can either upload an existing audio file or record directly in your browser. Both methods work great for creating high-quality voice clones.",
    icon: Upload,
    details: [
      "Upload audio files (MP3, WAV, M4A)",
      "Record directly using your microphone",
      "Minimum 60 seconds of audio recommended"
    ]
  },
  {
    number: 2,
    title: "Record or Upload Audio",
    description: "Provide clear, natural speech samples. Read a provided script or use your own text. The more natural and varied your speech, the better the clone will sound.",
    icon: Mic,
    details: [
      "Read the provided script naturally",
      "Speak in a quiet environment",
      "Use your normal speaking voice and pace"
    ]
  },
  {
    number: 3,
    title: "AI Processing",
    description: "Our advanced AI analyzes your voice patterns, tone, and characteristics to create a digital model of your unique voice.",
    icon: Sparkles,
    details: [
      "AI analyzes voice characteristics",
      "Creates a unique voice model",
      "Processing typically takes 2-5 minutes"
    ]
  },
  {
    number: 4,
    title: "Preview & Test",
    description: "Listen to a preview of your cloned voice narrating a sample text. Make sure it sounds natural and accurate before saving.",
    icon: Play,
    details: [
      "Preview your cloned voice",
      "Test with different text samples",
      "Adjust settings if needed"
    ]
  },
  {
    number: 5,
    title: "Save to Library",
    description: "Once you're happy with the result, save your voice clone to your library. You can then use it to narrate any story you create.",
    icon: CheckCircle2,
    details: [
      "Add a name and description",
      "Tag with categories (Family, Educator, etc.)",
      "Use in your story narrations"
    ]
  }
]

const useCases = [
  {
    icon: User,
    title: "Family Voices",
    description: "Preserve the voices of family members to create personalized stories that sound like your loved ones are reading them."
  },
  {
    icon: BookOpen,
    title: "Story Narration",
    description: "Use your cloned voice to narrate stories, making them more personal and engaging for your family."
  },
  {
    icon: Volume2,
    title: "Multiple Characters",
    description: "Clone different voices to create multi-character stories with distinct narrators for each role."
  }
]

const requirements = [
  {
    icon: FileAudio,
    title: "Audio Quality",
    description: "Clear audio with minimal background noise. Record in a quiet space for best results."
  },
  {
    icon: Clock,
    title: "Duration",
    description: "At least 60 seconds of speech is recommended, though longer samples (2-3 minutes) produce better results."
  },
  {
    icon: Mic,
    title: "Natural Speech",
    description: "Speak naturally and clearly. Don't rush or over-enunciate. Use your normal conversational tone."
  }
]

export function VoiceCloningGuide() {
  return (
    <div className="space-y-8">
      {/* Coming Soon Notice - Moved to Top */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Voice Cloning Coming Soon</h3>
              <p className="text-base text-muted-foreground">
                We&apos;re working hard to bring you this exciting feature! Voice cloning will allow you to create digital copies of voices that can narrate your stories, making them more personal and engaging. Check back soon for updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            How Voice Cloning Works
          </CardTitle>
          <CardDescription className="text-base">
            Create a digital copy of your voice using advanced AI technology. Your cloned voice can then be used to narrate stories, bringing a personal touch to your family&apos;s storytelling experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-1">2-5 min</div>
              <div className="text-sm text-muted-foreground">Processing Time</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-1">60+ sec</div>
              <div className="text-sm text-muted-foreground">Audio Required</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-1">High</div>
              <div className="text-sm text-muted-foreground">Quality Output</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Process */}
      <div>
        <h2 className="text-3xl font-bold mb-6">The Process</h2>
        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Card key={step.number} className="relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <CardContent className="p-6 sm:p-8">
                  <div className="flex gap-6 sm:gap-8">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <Badge variant="outline" className="text-base sm:text-lg font-semibold px-3 py-1">
                          Step {step.number}
                        </Badge>
                        <h3 className="text-xl sm:text-2xl font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed">{step.description}</p>
                      <ul className="space-y-3 sm:space-y-4">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-base sm:text-lg">
                            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Use Cases */}
      <div>
        <h2 className="text-3xl font-bold mb-6">Use Cases</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Requirements & Tips */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>What you need for the best results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requirements.map((req, index) => {
              const Icon = req.icon
              return (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary mt-0.5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">{req.title}</div>
                    <div className="text-sm text-muted-foreground">{req.description}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for Best Results</CardTitle>
            <CardDescription>Get the most out of voice cloning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Record in a quiet, echo-free environment</span>
            </div>
            <div className="flex gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Speak at your natural pace - don&apos;t rush</span>
            </div>
            <div className="flex gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Include varied intonation and emotion</span>
            </div>
            <div className="flex gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Use a good quality microphone if possible</span>
            </div>
            <div className="flex gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Record multiple samples for better accuracy</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

