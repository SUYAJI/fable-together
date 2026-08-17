import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isDemoMode } from "@/lib/app-mode"

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      message: "Demo invitation was not sent.",
      persisted: false,
      mode: "demo",
    })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Get the current user to track who sent the invite
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if the email is already registered
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Create admin client to check if user exists and send invite
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 400 }
      )
    }

    // Get site URL for redirect
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
      : "https://app.fabletogether.com"

    // Send invitation email using Supabase's inviteUserByEmail
    // This uses Supabase's email templates configured in the dashboard
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${siteUrl}/register`,
        data: {
          invited_by: user.id,
          invited_by_email: user.email,
        },
      }
    )

    if (inviteError) {
      console.error("Error sending invite:", inviteError)
      return NextResponse.json(
        { error: "Failed to send invitation. Please try again." },
        { status: 500 }
      )
    }

    // TODO: Track referral in database for credit rewards
    // You can create a referrals table to track:
    // - inviter_user_id
    // - invitee_email
    // - invited_at
    // - signed_up_at (update when they register)
    // - credits_awarded

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      email: email,
    })
  } catch (error) {
    console.error("Error in invite API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

