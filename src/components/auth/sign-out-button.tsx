"use client";
import { isDemoMode } from "@/lib/app-mode";
import { getClientServices } from "@/lib/services/client";

export function SignOutButton() {
  if (isDemoMode()) {
    return (
      <span className="rounded border px-3 py-2 text-sm text-muted-foreground">
        Demo Mode
      </span>
    );
  }

  return (
    <button
      onClick={async () => {
        await getClientServices().auth.signOut();
        window.location.href = "/";
      }}
      className="rounded border px-3 py-2"
    >
      Sign out
    </button>
  );
}
