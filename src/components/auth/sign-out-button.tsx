"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton() {
  return (
    <button
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
      className="rounded border px-3 py-2"
    >
      Sign out
    </button>
  );
}
