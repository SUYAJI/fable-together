"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterModal({ open, onOpenChange }: RegisterModalProps) {
  // Fillout form embed URL - Update this if Fillout provides a different embed URL
  const filloutEmbedUrl = "https://fabletogether.fillout.com/t/fu7SAx3k6Mus"
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[98vw] sm:!w-[95vw] md:!w-[92vw] lg:!w-[90vw] xl:!w-[88vw] !max-w-none sm:!max-w-[95vw] md:!max-w-[92vw] lg:!max-w-[90vw] xl:!max-w-[88vw] 2xl:!max-w-[1800px] !max-h-[95vh] !h-[95vh] modal-slide-up flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 md:px-8 lg:px-10 pt-4 sm:pt-6 md:pt-8">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold">
            Create Your Account
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Join Fable Together to begin creating personalized stories with your family. Please complete the registration form below to set up your account and start your storytelling journey.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-8 overflow-hidden">
          <iframe
            src={filloutEmbedUrl}
            className="w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] border-0 rounded-lg"
            title="Registration Form"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
            aria-label="Registration form"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

