"use client"

import { Button } from "@/components/ui/button"
import { X, CheckCircle2, Lightbulb, ArrowRight } from "lucide-react"
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
        <div className="bg-primary/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white/90">Quest: {task.questTitle}</span>
                    <span className="text-xs text-white/70">
                      Task {task.taskNumber} of {task.totalTasks}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-1">{task.title}</h3>
                </div>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 text-white hover:bg-white/10"
                    onClick={() => {
                      setIsVisible(false)
                      onDismiss?.()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-white/90 mb-2 leading-relaxed">
                {task.instructions}
              </p>
              {onComplete && (
                <Button
                  size="sm"
                  className="bg-white text-primary hover:bg-white/90 h-7 text-xs"
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


