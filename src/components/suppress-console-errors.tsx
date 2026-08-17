"use client"

import { useEffect } from "react"

/**
 * Component to suppress non-critical console errors and warnings
 * This improves user experience by reducing noise in production
 */
export function SuppressConsoleErrors() {
  useEffect(() => {
    // Suppress Vercel Analytics script loading errors (expected if not enabled)
    const originalError = console.error
    console.error = (...args: unknown[]) => {
      const message = args[0]?.toString() || ""
      // Suppress Vercel Analytics errors
      if (
        message.includes("_vercel/insights/script.js") ||
        message.includes("Vercel Web Analytics") ||
        message.includes("Failed to load script from /_vercel/insights")
      ) {
        return // Suppress this error
      }
      // Suppress font preload warnings (these are just warnings, not errors)
      if (message.includes("preloaded with link preload was not used")) {
        return // Suppress this warning
      }
      // Call original error handler for other errors
      originalError.apply(console, args)
    }

    // Suppress console warnings for font preload
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => {
      const message = args[0]?.toString() || ""
      // Suppress font preload warnings
      if (message.includes("preloaded with link preload was not used")) {
        return // Suppress this warning
      }
      // Suppress Feature Policy warnings (browser compatibility)
      if (message.includes("Feature Policy: Skipping unsupported feature name")) {
        return // Suppress this warning
      }
      // Call original warn handler for other warnings
      originalWarn.apply(console, args)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return null
}
