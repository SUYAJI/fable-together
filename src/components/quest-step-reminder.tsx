"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, ArrowRight } from "lucide-react"
import { QuestPathTask } from "@/lib/quest-path-tasks"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface QuestStepReminderProps {
  open: boolean
  onClose: () => void
  task: QuestPathTask
  pathName: string
  autoShow?: boolean
}

export function QuestStepReminder({
  open,
  onClose,
  task,
  pathName,
  autoShow = false,
}: QuestStepReminderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const TaskIcon = task.icon
  const [dismissed, setDismissed] = useState(false)

  // Auto-show if user is on the relevant page and reminder hasn't been dismissed
  useEffect(() => {
    if (autoShow && !dismissed && pathname?.startsWith(task.route)) {
      // Small delay to avoid jarring transitions
      const timer = setTimeout(() => {
        // Check if reminder was dismissed for this specific task
        const dismissedKey = `quest-reminder-dismissed-${task.id}`
        const wasDismissed = localStorage.getItem(dismissedKey)
        if (!wasDismissed) {
          // Will be handled by parent component
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoShow, dismissed, pathname, task.route, task.id])

  if (!open || dismissed) return null

  const handleNavigate = () => {
    onClose() // Close reminder first
    // Small delay to ensure smooth transition
    setTimeout(() => {
      router.push(task.route)
    }, 100)
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Remember dismissal for this task
    localStorage.setItem(`quest-reminder-dismissed-${task.id}`, "true")
    onClose()
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        open
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none",
        "md:left-64" // Account for sidebar width (w-64 = 16rem) on medium+ screens
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
        <div className="bg-background/95 dark:bg-background/95 border border-border rounded-lg shadow-xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 backdrop-blur-md">
          <div
            className={cn(
              "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full flex-shrink-0",
              "bg-primary/10 text-primary"
            )}
          >
            <TaskIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
              {pathName} • Current Step
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1.5 text-foreground">
              {task.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {task.description}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleNavigate}
              className="gap-2"
            >
                    {task.actionText || "Go to Step"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="flex-shrink-0"
                    aria-label="Close reminder"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
