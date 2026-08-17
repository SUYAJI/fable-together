"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Mail, MessageCircle } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface InviteFriendsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const [email, setEmail] = useState("")
  const { toast } = useToast()

  const inviteLink = typeof window !== "undefined" 
    ? `${window.location.origin}/register` 
    : "https://app.fabletogether.com/register"

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Link copied!",
        description: "Invite link has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const [isSending, setIsSending] = useState(false)

  const handleEmailInvite = async () => {
    if (!email || !email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      toast({
        title: "Invitation sent!",
        description: `An invitation email has been sent to ${email}`,
      })
      setEmail("")
    } catch (error) {
      console.error("Error sending invite:", error)
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            Share Fable Together with your friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <Label>Invite Link</Label>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} size="icon" variant="outline" aria-label="Copy invite link">
                <Copy className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Email Invite */}
          <div className="space-y-2">
            <Label htmlFor="email">Send via Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSending) {
                    handleEmailInvite()
                  }
                }}
                className="flex-1"
                disabled={isSending}
              />
              <Button 
                onClick={handleEmailInvite} 
                variant="outline"
                disabled={isSending}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>

          {/* Social Share Placeholder */}
          <div className="space-y-2">
            <Label>Share on Social Media</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled>
                <MessageCircle className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
