/**
 * Browser-side Supabase client creation
 * 
 * This module provides a browser-side Supabase client for use in:
 * - Client components
 * - Browser-based authentication
 * - Real-time subscriptions
 * 
 * The client uses the anon key and respects Row Level Security (RLS) policies.
 */

import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any; // TODO: Replace with generated types from Supabase CLI

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for browser-side usage
 * 
 * This client is designed for client components and handles:
 * - Browser-based authentication
 * - Local storage for sessions
 * - Real-time subscriptions
 * - Automatic token refresh
 * 
 * @returns Configured Supabase client instance
 * 
 * @example
 * const supabase = createSupabaseBrowserClient()
 * const { data } = await supabase.from('stories').select('*')
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(url, anon);
}