/**
 * Server-side Supabase client creation
 * 
 * This module provides a server-side Supabase client for use in:
 * - API routes
 * - Server components
 * - Server actions
 * 
 * The client handles cookie-based authentication automatically
 * and uses the service role key for elevated permissions when needed.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any; // TODO: Replace with generated types from Supabase CLI

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Creates a Supabase client for server-side usage
 * 
 * This client automatically handles:
 * - Cookie-based session management
 * - Server-side authentication
 * - Row Level Security (RLS) policies
 * 
 * @returns Configured Supabase client instance
 * @throws Error if required environment variables are missing
 * 
 * @example
 * const supabase = await createSupabaseServerClient()
 * const { data } = await supabase.from('stories').select('*')
 */
export async function createSupabaseServerClient() {
  if (!url || !anon) {
    throw new Error("Missing Supabase environment variables");
  }

  try {
    const cookieStore = await cookies();

    return createServerClient<Database>(url, anon, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    });
  } catch (error) {
    console.error("Error creating Supabase server client:", error);
    throw error;
  }
}