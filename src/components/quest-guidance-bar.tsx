"use client"

import { Button } from "@/components/ui/button"
import { X, CheckCircle2, Lightbulb } from "lucide-react"
import { useState } from "react"

interface QuestTask {
  id: string
  title: string
  description: string
  instructions: string
  questId: string
  questTitle: string
  taskNumber: number
  totalTasks: number
}

interface QuestGuidanceBarProps {
  task: QuestTask | null
  onDismiss?: () => void
  onComplete?: () => void
}

export function QuestGuidanceBar({ task, onDismiss, onComplete }: QuestGuidanceBarProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!task || !isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
        <div className="rounded-lg border border-primary/20 bg-primary/95 p-3 text-primary-foreground shadow-lg backdrop-blur-sm sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Lightbulb className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary-foreground/90">Quest: {task.questTitle}</span>
                    <span className="text-xs text-primary-foreground/70">
                      Task {task.taskNumber} of {task.totalTasks}
                    </span>
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-primary-foreground sm:text-base">{task.title}</h3>
                </div>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => {
                      setIsVisible(false)
                      onDismiss?.()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="mb-2 text-xs leading-relaxed text-primary-foreground/90 sm:text-sm">
                {task.instructions}
              </p>
              {onComplete && (
                <Button
                  size="sm"
                  className="h-7 bg-primary-foreground text-xs text-primary hover:bg-primary-foreground/90"
                  onClick={() => {
                    setIsVisible(false)
                    onComplete?.()
                  }}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1.5" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


