/**
 * Next.js Middleware for Authentication
 * 
 * This middleware handles:
 * - Route protection (redirects unauthenticated users to sign-in)
 * - Public route whitelisting
 * - Supabase session management via cookies
 * - Automatic authentication checks on protected routes
 * 
 * Runs on every request before the page renders, allowing for
 * server-side authentication verification.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { isDemoMode } from '@/lib/app-mode'

/**
 * Middleware function that runs on every request
 * 
 * @param request - The incoming Next.js request
 * @returns NextResponse with appropriate redirects or continuation
 */
export async function middleware(request: NextRequest) {
  if (isDemoMode()) {
    const productionAuthRoutes = ["/sign-in", "/auth"]
    if (productionAuthRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/landing',
    '/sign-in',
    '/auth/callback',
    '/api/webhooks',
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route + '/')
  )
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // For protected routes, check authentication
  // Note: We'll do a basic check here, but components will also verify
  const response = NextResponse.next()
  
  // Create Supabase client for server-side auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is not authenticated and trying to access protected route, redirect to sign-in
  if (!user && !isPublicRoute) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
