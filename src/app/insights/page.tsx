"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardTutorial } from "@/components/dashboard-tutorial"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, TrendingUp, Clock, Users } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"

export default function InsightsPage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-12 sm:mb-16">
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                Analytics
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Insights
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Track your family&apos;s storytelling journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold">
                    <AnimatedCounter value={24} />
                  </div>
                  <div className="text-sm text-muted-foreground">Total Stories</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold">
                    <AnimatedCounter value={156} />
                  </div>
                  <div className="text-sm text-muted-foreground">Community Engagement</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                    <Clock className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold">
                    <AnimatedCounter value="12.5h" />
                  </div>
                  <div className="text-sm text-muted-foreground">Total Listening Time</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold">
                    <AnimatedCounter value={4} />
                  </div>
                  <div className="text-sm text-muted-foreground">Active Family Members</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Detailed Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  We&apos;re working on comprehensive insights to help you understand your family&apos;s storytelling patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <DashboardTutorial />
      </div>
    </div>
  )
}
