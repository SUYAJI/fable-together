import { NextResponse } from "next/server"

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  details?: unknown
}

/**
 * Standardized API error handler
 * Ensures consistent error response format across all API routes
 */
export function handleApiError(
  error: unknown,
  defaultMessage = "An error occurred",
  defaultStatusCode = 500
): NextResponse {
  console.error("API Error:", error)

  let message = defaultMessage
  let statusCode = defaultStatusCode
  let code: string | undefined
  let details: unknown = undefined

  if (error instanceof Error) {
    message = error.message

    // Handle specific error types
    if (error.message.includes("Unauthorized") || error.message.includes("authentication")) {
      statusCode = 401
      message = "Authentication required"
    } else if (error.message.includes("not found")) {
      statusCode = 404
    } else if (error.message.includes("already exists") || error.message.includes("duplicate")) {
      statusCode = 409
    } else if (error.message.includes("validation") || error.message.includes("invalid")) {
      statusCode = 400
    }

    // Sanitize error messages to remove sensitive information
    message = sanitizeErrorMessage(message)
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === "development") {
    details = error instanceof Error ? error.stack : String(error)
  }

  return NextResponse.json(
    {
      error: message,
      code,
      ...(process.env.NODE_ENV === "development" && { details }),
    },
    { status: statusCode }
  )
}

/**
 * Sanitize error messages to remove sensitive information
 */
function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/api[_-]?key/gi, "[API_KEY]")
    .replace(/password/gi, "[PASSWORD]")
    .replace(/token/gi, "[TOKEN]")
    .replace(/secret/gi, "[SECRET]")
    .replace(/authorization/gi, "[AUTH]")
    .substring(0, 200) // Limit message length
}

/**
 * Create a success response with consistent format
 */
export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 200 }
  )
}

/**
 * Create an error response with consistent format
 */
export function errorResponse(
  message: string,
  statusCode = 500,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    { status: statusCode }
  )
}









