"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, ArrowRight, X, Trophy, Sparkles } from "lucide-react"
import { QuestPathConfig, QuestPathTask } from "@/lib/quest-path-tasks"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface QuestPathModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pathConfig: QuestPathConfig
  onComplete?: (creditsEarned: number) => void
}

export function QuestPathModal({
  open,
  onOpenChange,
  pathConfig,
  onComplete,
}: QuestPathModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [earnedCredits, setEarnedCredits] = useState(0)

  const { path, tasks, creditsReward } = pathConfig
  const totalTasks = tasks.length
  const progress = completedTasks.size
  const progressPercent = (progress / totalTasks) * 100
  const isCompleted = progress === totalTasks

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setCurrentTaskIndex(0)
      setCompletedTasks(new Set())
      setIsCompleting(false)
      setShowCongratulations(false)
      setEarnedCredits(0)
    }
  }, [open])

  // Listen for quest completion events
  useEffect(() => {
    if (!open) return

    const handleQuestRefresh = () => {
      // Check if any tasks should be auto-completed based on route
      const checkAutoCompletion = () => {
        tasks.forEach((task, index) => {
          if (pathname?.startsWith(task.route) && !completedTasks.has(task.id)) {
            // User is on the task route - could auto-complete or wait for action
            // For now, we'll keep manual completion but this can be enhanced
          }
        })
      }

      checkAutoCompletion()
    }

    window.addEventListener("quest-refresh", handleQuestRefresh)
    return () => window.removeEventListener("quest-refresh", handleQuestRefresh)
  }, [open, pathname, tasks, completedTasks])

  const handleTaskComplete = async (taskId: string) => {
    const newCompleted = new Set(completedTasks)
    newCompleted.add(taskId)
    setCompletedTasks(newCompleted)

    // Move to next task if not last
    if (currentTaskIndex < totalTasks - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1)
      toast({
        title: "Task Complete!",
        description: "Great progress! Continue to the next step.",
      })
    } else {
      // All tasks completed - auto-complete path
      setTimeout(() => {
        handlePathComplete()
      }, 500) // Small delay for better UX
    }
  }

  const handlePathComplete = async () => {
    if (isCompleting) return // Prevent double completion
    setIsCompleting(true)
    
    try {
      // Track quest completion via API
      // Note: For now, we'll use localStorage for path quests since they're not in the database
      // In the future, these could be added to quests_master table
      const questId = `path_${path.id}`
      
      // Try API first
      const response = await fetch("/api/quests/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId,
          increment: totalTasks,
        }),
      })

      let creditsEarned = creditsReward

      if (response.ok) {
        const data = await response.json()
        creditsEarned = data.creditsAwarded || creditsReward
        
        // Refresh credits display
        window.dispatchEvent(new CustomEvent("quest-refresh"))
        window.dispatchEvent(new CustomEvent("credits-refresh"))
      } else {
        // If API fails (quest not in DB), use localStorage and still award credits
        const localQuest = {
          id: questId,
          slug: questId,
          title: path.name,
          status: "completed" as const,
          progress: totalTasks,
          progress_max: totalTasks,
          credits_reward: creditsReward,
          completed_at: new Date().toISOString(),
        }
        localStorage.setItem(`quest_${questId}`, JSON.stringify(localQuest))
        
        // Refresh credits display
        window.dispatchEvent(new CustomEvent("quest-refresh"))
        window.dispatchEvent(new CustomEvent("credits-refresh"))
      }
      
      setEarnedCredits(creditsEarned)
      setShowCongratulations(true)
      
      if (onComplete) {
        onComplete(creditsEarned)
      }
    } catch (error) {
      console.error("Error completing quest path:", error)
      // Still show congratulations even on error
      setEarnedCredits(creditsReward)
      setShowCongratulations(true)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleNavigateToTask = (task: QuestPathTask) => {
    router.push(task.route)
  }

  const currentTask = tasks[currentTaskIndex]
  const PathIcon = path.icon

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[85vh]">
        {showCongratulations ? (
          /* Congratulations Screen */
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[400px]">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-bounce">
              <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <DrawerTitle className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Path Complete! 🎉
            </DrawerTitle>
            <DrawerDescription className="text-base sm:text-lg mb-6 sm:mb-8 max-w-md">
              Congratulations! You've completed the {path.name} path and earned tokens.
            </DrawerDescription>
            <div className="glass-card border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-xl p-6 sm:p-8 mb-6 sm:mb-8 w-full max-w-md">
              <div className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                +{earnedCredits}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">
                Tokens Added to Your Account
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => {
                setShowCongratulations(false)
                onOpenChange(false)
              }}
              className="gap-2"
            >
              Continue Exploring
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <>
            <DrawerHeader className="text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        path.color.bg,
                        path.color.darkBg
                      )}
                    >
                      <PathIcon
                        className={cn(
                          "h-5 w-5",
                          path.color.icon,
                          path.color.darkIcon
                        )}
                      />
                    </div>
                    <DrawerTitle className="text-xl sm:text-2xl font-bold">
                      {path.name}
                    </DrawerTitle>
                  </div>
                  <DrawerDescription className="text-base mt-2">
                    {path.description}
                  </DrawerDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="flex-shrink-0"
                  aria-label="Close quest path modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress Section */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">
                    {progress} of {totalTasks} tasks
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                {isCompleted && !showCongratulations && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    <Trophy className="h-4 w-4" />
                    <span>Path Complete! +{creditsReward} tokens earned</span>
                  </div>
                )}
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-3">
            {tasks.map((task, index) => {
              const TaskIcon = task.icon
              const isTaskCompleted = completedTasks.has(task.id)
              const isCurrentTask = index === currentTaskIndex && !isTaskCompleted
              const isPastTask = index < currentTaskIndex || isTaskCompleted

              return (
                <Card
                  key={task.id}
                  className={cn(
                    "transition-all",
                    isCurrentTask
                      ? "ring-2 ring-primary border-primary/20 bg-primary/5"
                      : isTaskCompleted
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "border-border"
                  )}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {isTaskCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : isCurrentTask ? (
                          <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                          </div>
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TaskIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <h3
                              className={cn(
                                "font-semibold text-base sm:text-lg",
                                isCurrentTask && "text-primary"
                              )}
                            >
                              {task.title}
                            </h3>
                            {isCurrentTask && (
                              <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {task.description}
                        </p>

                        {/* Action Button */}
                        {isCurrentTask && !isTaskCompleted && (
                          <Button
                            size="sm"
                            onClick={() => handleNavigateToTask(task)}
                            className="gap-2"
                          >
                            {task.actionText || "Get Started"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Complete Button (for manual completion) */}
                        {isCurrentTask && !isTaskCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskComplete(task.id)}
                            className="ml-2 gap-2"
                            disabled={isCompleting}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

            {!showCongratulations && (
              <DrawerFooter className="border-t pt-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    {isCompleted ? (
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                        <Trophy className="h-4 w-4" />
                        All tasks completed!
                      </span>
                    ) : (
                      <span>
                        Complete all tasks to earn {creditsReward} tokens
                      </span>
                    )}
                  </div>
                  {isCompleted && !showCongratulations && (
                    <Button
                      onClick={handlePathComplete}
                      size="sm"
                      className="gap-2"
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <>
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          Claim Rewards
                          <Trophy className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DrawerFooter>
            )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
