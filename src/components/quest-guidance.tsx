"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, CheckCircle2, Lightbulb } from "lucide-react"
import { useState, useEffect } from "react"

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

interface QuestGuidanceProps {
  task: QuestTask | null
  onDismiss?: () => void
  onComplete?: () => void
}

export function QuestGuidance({ task, onDismiss, onComplete }: QuestGuidanceProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (task) {
      setIsVisible(true)
    }
  }, [task])

  if (!task || !isVisible) return null

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-lg mb-6 animate-slide-down">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">Quest: {task.questTitle}</span>
                  <span className="text-xs text-muted-foreground">
                    Task {task.taskNumber} of {task.totalTasks}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1">{task.title}</h3>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => {
                    setIsVisible(false)
                    onDismiss?.()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {task.instructions}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground italic mb-3">
                {task.description}
              </p>
            )}
            {onComplete && (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setIsVisible(false)
                  onComplete?.()
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


