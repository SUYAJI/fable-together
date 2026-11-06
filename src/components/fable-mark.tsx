import { cn } from "@/lib/utils"

interface FableMarkProps {
  className?: string
  /** Hide the wordmark and show only the moon (collapsed sidebar). */
  compact?: boolean
}

/** Crescent moon used as the Fable Together symbol. */
export function FableMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} aria-hidden="true">
      <path
        d="M15.6 3.2a8.6 8.6 0 1 0 5.2 13.9A7.2 7.2 0 0 1 15.6 3.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Brand lockup: moon plus serif wordmark. */
export function FableMark({ className, compact = false }: FableMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <FableMoon className="text-lantern" />
      {!compact && (
        <span className="font-serif text-[1.35rem] font-medium leading-none tracking-[-0.01em]">
          Fable Together
        </span>
      )}
    </span>
  )
}
