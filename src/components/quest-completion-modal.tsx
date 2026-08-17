"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Coins, ArrowRight, Trophy } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"
import { refreshCreditsDisplay } from "@/components/credits-display"
import { useEffect } from "react"

interface QuestCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditsEarned: number
  questTitle: string
  taskTitle: string
  nextTask?: {
    title: string
    route: string
  } | null
  onNextTask?: () => void
  onClose?: () => void
}

export function QuestCompletionModal({
  open,
  onOpenChange,
  creditsEarned,
  questTitle,
  taskTitle,
  nextTask,
  onNextTask,
  onClose,
}: QuestCompletionModalProps) {
  // Refresh credits display when modal opens
  useEffect(() => {
    if (open && creditsEarned > 0) {
      refreshCreditsDisplay()
    }
  }, [open, creditsEarned])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            {nextTask ? "Task Complete! 🎉" : "Quest Complete! 🎉🎉"}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {nextTask ? (
              <>
                You&apos;ve completed: <span className="font-semibold">{taskTitle}</span>
              </>
            ) : (
              <>
                Congratulations! You&apos;ve completed the quest: <span className="font-semibold">{questTitle}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Credits Earned - Only show when quest is completed */}
          {!nextTask && creditsEarned > 0 && (
            <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Tokens Earned</span>
              </div>
              <div className="text-4xl font-bold text-primary">
                +<AnimatedCounter value={creditsEarned} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tokens have been added to your account
              </p>
            </div>
          )}
          
          {/* Task completion message (no tokens) */}
          {nextTask && (
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Great progress! Continue to the next step.
              </p>
            </div>
          )}

          {/* Quest Progress */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Quest Progress</p>
            <p className="text-base font-semibold">{questTitle}</p>
          </div>

          {/* Next Task or Close */}
          <div className="flex flex-col gap-3">
            {nextTask ? (
              <>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    onOpenChange(false)
                    onNextTask?.()
                  }}
                >
                  Continue to Next Task
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Next: {nextTask.title}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false)
                    onClose?.()
                  }}
                >
                  I&apos;ll do it later
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  onOpenChange(false)
                  onClose?.()
                }}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Awesome! Keep Going
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

