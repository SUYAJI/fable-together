"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SignInForm } from "@/components/auth/sign-in-form"
import { LegalModal } from "@/components/auth/legal-modal"

export function AuthToggleForm() {
  const [mode, setMode] = useState<"register" | "signin">("register")
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy">("terms")
  const filloutEmbedUrl = "https://fabletogether.fillout.com/t/fu7SAx3k6Mus"

  const handleLegalLinkClick = (type: "terms" | "privacy") => {
    setLegalModalType(type)
    setLegalModalOpen(true)
  }

  return (
    <Card className="card-elevated animate-fade-in-up-delay-3 relative z-10 bg-card/95 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8">
        {/* Toggle Buttons */}
        <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
          <Button
            type="button"
            variant={mode === "register" ? "default" : "ghost"}
            onClick={() => setMode("register")}
            className={`flex-1 transition-all ${
              mode === "register"
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "hover:bg-muted-foreground/10"
            }`}
          >
            Register
          </Button>
          <Button
            type="button"
            variant={mode === "signin" ? "default" : "ghost"}
            onClick={() => setMode("signin")}
            className={`flex-1 transition-all ${
              mode === "signin"
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "hover:bg-muted-foreground/10"
            }`}
          >
            Sign In
          </Button>
        </div>

        {/* Content based on mode */}
        {mode === "register" ? (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                Create Your Account
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Join Fable Together to begin creating personalized stories with your family. Please complete the registration form below to set up your account and start your storytelling journey.
              </p>
            </div>

            <div className="relative w-full min-h-[500px] sm:min-h-[600px] md:min-h-[650px] lg:min-h-[700px]">
              <iframe
                src={filloutEmbedUrl}
                className="w-full h-full min-h-[500px] sm:min-h-[600px] md:min-h-[650px] lg:min-h-[700px] border border-border rounded-lg"
                title="Registration Form"
                allow="clipboard-read; clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                aria-label="Registration form"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                Sign in
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Sign in with your email and password, or use a magic link.
              </p>
            </div>

            <SignInForm />

            <p className="text-sm md:text-base text-muted-foreground text-center mt-4">
              By signing in, you agree to our{" "}
              <button
                type="button"
                onClick={() => handleLegalLinkClick("terms")}
                className="underline hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
              >
                Terms of Service
              </button>
              {" "}and{" "}
              <button
                type="button"
                onClick={() => handleLegalLinkClick("privacy")}
                className="underline hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        )}

        {/* Legal Modal */}
        <LegalModal
          open={legalModalOpen}
          onOpenChange={setLegalModalOpen}
          type={legalModalType}
        />
      </CardContent>
    </Card>
  )
}

