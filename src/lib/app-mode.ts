export type AppMode = "demo" | "production"

interface ModeEnvironment {
  demoFlag?: string
  supabaseUrl?: string
  supabaseAnonKey?: string
}

const TRUE_VALUES = new Set(["1", "true", "yes", "on"])
const FALSE_VALUES = new Set(["0", "false", "no", "off"])

export function resolveAppMode({
  demoFlag,
  supabaseUrl,
  supabaseAnonKey,
}: ModeEnvironment): AppMode {
  const normalizedFlag = demoFlag?.trim().toLowerCase()

  if (normalizedFlag && TRUE_VALUES.has(normalizedFlag)) return "demo"
  if (normalizedFlag && FALSE_VALUES.has(normalizedFlag)) return "production"

  return supabaseUrl && supabaseAnonKey ? "production" : "demo"
}

export function getAppMode(): AppMode {
  return resolveAppMode({
    demoFlag: process.env.NEXT_PUBLIC_DEMO_MODE,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo"
}
