"use client"

import { useState } from "react"
import { LegalModal } from "@/components/auth/legal-modal"

export function AppFooter() {
  const currentYear = new Date().getFullYear()
  const [modalType, setModalType] = useState<"terms" | "privacy" | "contact" | null>(null)

  return (
    <>
      <div className="mt-auto">
        <footer className="border-t bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Fable Together</h3>
              <p className="text-sm text-muted-foreground">
                Creating magical storytelling experiences for families.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setModalType("privacy")}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType("terms")}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType("contact")}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Stay updated with our latest stories and features.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {currentYear} Fable Together. All rights reserved.
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

