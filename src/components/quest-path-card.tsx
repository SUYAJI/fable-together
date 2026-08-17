"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CheckCircle2, Trophy } from "lucide-react"
import { QuestPath, QUEST_PATHS } from "@/lib/quest-paths"
import { getQuestPathConfig } from "@/lib/quest-path-tasks"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface QuestPathCardProps {
  path: QuestPath
  className?: string
}

/**
 * Reusable quest path card component
 * Used on both Dashboard and Quests pages to ensure consistent design
 * Shows progress and completion status
 */
export function QuestPathCard({ path, className }: QuestPathCardProps) {
  const Icon = path.icon
  const config = getQuestPathConfig(path.id)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [isComplete, setIsComplete] = useState(false)

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && config) {
      const saved = localStorage.getItem("quest-completed-tasks")
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Record<string, string[]>
          const pathTasks = (parsed[path.id] || []) as string[]
          const taskSet = new Set<string>(pathTasks)
          setCompletedTasks(taskSet)
          setIsComplete(taskSet.size === config.tasks.length && config.tasks.length > 0)
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [path.id, config])

  const progress = completedTasks.size
  const totalTasks = config?.tasks.length || 0
  const progressPercent = totalTasks > 0 ? (progress / totalTasks) * 100 : 0

  return (
    <Link href={`/quests`} className={cn("block", className)}>
      <Card className="glass-card group transition-all duration-200 hover:ring-2 hover:ring-border hover:ring-offset-2 cursor-pointer border-border/50 h-full hover:shadow-lg hover:scale-[1.02]">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                path.color.bg,
                path.color.darkBg
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  path.color.icon,
                  path.color.darkIcon
                )}
              />
            </div>
            {isComplete && (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
            {!isComplete && progress > 0 && (
              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                {progress}/{totalTasks}
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">{path.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            {path.description}
          </p>
          
          {/* Progress Bar */}
          {totalTasks > 0 && progress > 0 && !isComplete && (
            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    "bg-primary"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>{config?.creditsReward || 0} tokens</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <span>
                {isComplete
                  ? "View Path"
                  : progress > 0
                  ? "Continue"
                  : path.id === "explore"
                  ? "Start Exploring"
                  : path.id === "create"
                  ? "Start Creating"
                  : "Join Community"}
              </span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Quest paths grid component for displaying multiple paths
 */
interface QuestPathsGridProps {
  paths?: QuestPath[]
  className?: string
}

export function QuestPathsGrid({ paths, className }: QuestPathsGridProps) {
  // Use provided paths or fall back to shared config
  const displayPaths: QuestPath[] = paths || QUEST_PATHS

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {displayPaths.map((path: QuestPath) => (
        <QuestPathCard key={path.id} path={path} />
      ))}
    </div>
  )
}
