"use client"

import { useState } from "react"
import { LegalModal } from "@/components/auth/legal-modal"

export function DashboardFooter() {
  const currentYear = new Date().getFullYear()
  const [modalType, setModalType] = useState<"terms" | "privacy" | "contact" | null>(null)

  return (
    <>
      <div className="mt-auto">
        <footer className="border-t border-border/50 bg-background py-4 px-6 relative z-10 flex-shrink-0">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <div>
              <span>© {currentYear} Fable Together. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setModalType("privacy")}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Privacy
              </button>
              <button
                onClick={() => setModalType("terms")}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Terms
              </button>
              <button
                onClick={() => setModalType("contact")}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Contact
              </button>
            </div>
          </div>
        </footer>
      </div>
      {modalType && (
        <LegalModal
          open={modalType !== null}
          onOpenChange={(open) => !open && setModalType(null)}
          type={modalType}
        />
      )}
    </>
  )
}

