"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Trophy, ArrowRight } from "lucide-react"
import { SimpleQuest } from "@/lib/simple-quests"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface SimpleQuestCardProps {
  quest: SimpleQuest
  completed: boolean
  onNavigate?: () => void
}

export function SimpleQuestCard({ quest, completed, onNavigate }: SimpleQuestCardProps) {
  const router = useRouter()
  const QuestIcon = quest.icon

  const handleClick = () => {
    if (onNavigate) {
      onNavigate()
    } else {
      router.push(quest.route)
    }
  }

  return (
    <Card className={cn(
      "glass-card border-border/50 overflow-hidden transition-all",
      completed && "opacity-75"
    )}>
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Icon */}
          <div className={cn(
            "flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full flex-shrink-0",
            completed 
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "bg-primary/10 text-primary"
          )}>
            <QuestIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold">{quest.title}</h3>
              {completed && (
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
            
            <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
              {quest.description}
            </p>

            {/* Progress and Reward */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span>{quest.reward} tokens</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {completed ? "1/1" : "0/1"} completed
                </div>
              </div>

              {!completed && (
                <Button
                  onClick={handleClick}
                  className="gap-2"
                >
                  {quest.actionText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-500 ease-out",
                  completed
                    ? "bg-green-600 dark:bg-green-400 w-full"
                    : "bg-primary w-0"
                )}
                role="progressbar"
                aria-valuenow={completed ? 1 : 0}
                aria-valuemin={0}
                aria-valuemax={1}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
