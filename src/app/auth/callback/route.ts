import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  // Use 'next' param from callback URL, or default to dashboard
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    // Exchange the code for a session
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      // Redirect to sign-in page with error
      const errorUrl = new URL("/", requestUrl.origin);
      errorUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(errorUrl);
    }

    // Check if this is a password recovery flow
    if (type === "recovery") {
      // Redirect to password reset page with type parameter
      const resetUrl = new URL("/auth/reset-password", requestUrl.origin);
      resetUrl.searchParams.set("type", "recovery");
      return NextResponse.redirect(resetUrl);
    }

    // Verify user was created and get their info
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user after auth:", userError);
      const errorUrl = new URL("/", requestUrl.origin);
      errorUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(errorUrl);
    }

    // Ensure user profile exists (create if it doesn't)
    const isNewUser = false;
    const { error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist, create it - this is a new user
      // Note: email is stored in auth.users, not in profiles table
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          available_credits: 150, // Starting credits
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error creating profile:", insertError);
        // Continue anyway - profile can be created later
      }
    }

    // Check if user has a password set
    // We check user_metadata for has_password flag
    // If it doesn't exist, redirect to set password page
    const hasPassword = user.user_metadata?.has_password === true;
    
    // Also check if user was recently created (within last 5 minutes) - likely a new registration
    const userCreatedAt = new Date(user.created_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isRecentlyCreated = userCreatedAt > fiveMinutesAgo;

    // If user doesn't have a password flag set, redirect to set password page
    // This applies to new users and existing users who haven't set a password yet
    if (!hasPassword && isRecentlyCreated) {
      // New user - redirect to set password page
      return NextResponse.redirect(new URL("/auth/set-password", requestUrl.origin));
    }

    // Successfully authenticated - redirect to dashboard (or next URL)
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // No code parameter - redirect to home
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
