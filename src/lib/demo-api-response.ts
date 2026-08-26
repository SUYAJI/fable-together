import { NextResponse } from "next/server"
import { isDemoMode } from "@/lib/app-mode"

export function demoModeDisabledResponse(operation: string) {
  if (!isDemoMode()) return null
  return NextResponse.json(
    { success: false, demo: true, error: `${operation} is disabled in Demo Mode.` },
    { status: 409 },
  )
}
