"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PlaceholderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
}

export function PlaceholderModal({ open, onOpenChange, title, description }: PlaceholderModalProps) {
  const defaultDescription = `This feature is coming soon! ${title} functionality will be available in a future update.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            We&apos;re working hard to bring you this feature. Check back soon for updates!
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

