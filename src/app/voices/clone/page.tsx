"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardTutorial } from "@/components/dashboard-tutorial"
import { DashboardContentWrapper } from "@/components/dashboard-content-wrapper"
import { CloneVoiceForm } from "@/components/clone-voice-form"

export default function CloneVoicePage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <DashboardContentWrapper>
            <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
              {/* Header Section */}
              <div className="mb-8 sm:mb-12">
                <div className="text-xs sm:text-sm uppercase tracking-wide text-muted-foreground mb-3 sm:mb-4">
                  Voice Cloning
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                  Clone a Voice
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
                  Create a replica of your voice that sounds just like you. Upload an audio file or record directly to create an instant voice clone.
                </p>
              </div>

              <CloneVoiceForm />
            </div>
          </DashboardContentWrapper>
        </main>
        <DashboardTutorial />
      </div>
    </div>
  )
}

