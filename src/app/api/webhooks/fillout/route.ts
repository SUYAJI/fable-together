/**
 * Fillout Webhook API Route
 * 
 * Handles form submissions from Fillout registration forms.
 * Creates new users or updates existing users based on form data.
 * 
 * POST /api/webhooks/fillout
 * 
 * Features:
 * - Webhook secret verification
 * - User creation with metadata
 * - Profile creation
 * - Quest initialization
 * - Error handling and logging
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { demoModeDisabledResponse } from "@/lib/demo-api-response";

/**
 * Interface for Fillout question data
 */
interface FilloutQuestion {
  id: string
  name?: string
  key?: string
  type: string
  value: string | null
}

/**
 * Interface for Fillout webhook payload
 */
interface FilloutWebhookData {
  submission?: {
    questions?: FilloutQuestion[]
  }
  [key: string]: unknown
}

/**
 * Interface for user metadata
 */
interface UserMetadata {
  source: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
  [key: string]: unknown
}

/**
 * Process Fillout webhook submission
 * 
 * @param request - Webhook request from Fillout
 * @returns NextResponse with success/error status
 */
export async function POST(request: Request) {
  const demoResponse = demoModeDisabledResponse("Production registration webhooks")
  if (demoResponse) return demoResponse
  try {
    // Webhook received - minimal logging for production
    
    // Verify webhook authentication (optional but recommended)
    // Fillout doesn't provide built-in webhook secrets, but you can add a custom header
    // In Fillout: Integrate → Webhook → Advanced → Headers → Add "X-Webhook-Secret" header
    const webhookSecret = process.env.FILLOUT_WEBHOOK_SECRET;
    const providedSecret = request.headers.get("x-webhook-secret") || request.headers.get("x-fillout-signature");
    
    if (webhookSecret) {
      if (!providedSecret) {
        console.error("Webhook secret required but not provided in headers");
        return NextResponse.json({ error: "Unauthorized: Missing webhook secret" }, { status: 401 });
      }
      
      if (providedSecret !== webhookSecret) {
        console.error("Invalid webhook secret");
        return NextResponse.json({ error: "Unauthorized: Invalid webhook secret" }, { status: 401 });
      }
      
      // Webhook secret verified
    }

    let data: FilloutWebhookData;
    try {
      data = await request.json();
    } catch {
      // Handle empty body or invalid JSON
      // Empty or invalid JSON body - likely a test request
      return NextResponse.json({ 
        success: true,
        message: "Webhook endpoint is accessible",
        note: "This appears to be a test request with no data. Real form submissions will contain user data.",
        instructions: "To test with actual data, submit the form or use the webhook test with sample data."
      });
    }
    
    // Process incoming webhook data
    
    // Check if this is an empty test request
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ 
        success: true,
        message: "Webhook endpoint is accessible",
        note: "This appears to be a test request with no data. Real form submissions will contain user data.",
        instructions: "To test with actual data, submit the form or configure Fillout to send sample data in test requests."
      });
    }
    
    // Extract user data from Fillout response
    // Fillout sends data in a nested structure with questions array
    let email: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let phone: string | null = null;
    let role: string | null = null;
    let providerType: string | null = null;
    
    // Check if we have submission data with questions
    if (data.submission && data.submission.questions) {
      // Extract data from questions array - check multiple possible field name variations
      data.submission.questions.forEach((question: FilloutQuestion) => {
        const fieldName = (question.name || question.key || "").toLowerCase();
        const value = question.value;
        
        // Email variations
        if (fieldName.includes("email") || fieldName === "email address") {
          email = value;
        }
        // First name variations - very flexible matching
        else if (
          fieldName.includes("first") || 
          fieldName === "firstname" || 
          fieldName === "fname" || 
          fieldName === "given name" ||
          fieldName === "givenname" ||
          (fieldName.includes("name") && fieldName.includes("first") && !fieldName.includes("last"))
        ) {
          firstName = value;
        }
        // Last name variations - very flexible matching
        else if (
          fieldName.includes("last") || 
          fieldName === "lastname" || 
          fieldName === "lname" || 
          fieldName === "surname" || 
          fieldName === "family name" ||
          fieldName === "familyname" ||
          (fieldName.includes("name") && fieldName.includes("last") && !fieldName.includes("first"))
        ) {
          lastName = value;
        }
        // Phone variations
        else if (fieldName.includes("phone") || fieldName.includes("mobile") || fieldName.includes("tel")) {
          phone = value;
        }
        // Role variations
        else if (fieldName.includes("role") || fieldName.includes("provider type")) {
          role = value;
          providerType = value; // Same field, different name
        }
        // Provider type variations
        else if (fieldName.includes("provider")) {
          providerType = value;
        }
      });
    }
    
    // Fallback: try direct field access (for other formats)
    if (!email) {
      const dataRecord = data as Record<string, unknown>
      email = (dataRecord.email || dataRecord.Email || dataRecord.emailAddress || dataRecord.EmailAddress) as string | null
      firstName = (dataRecord.firstName || dataRecord.FirstName || dataRecord.first_name) as string | null
      lastName = (dataRecord.lastName || dataRecord.LastName || dataRecord.last_name) as string | null
      phone = (dataRecord.phone || dataRecord.Phone || dataRecord.phoneNumber || dataRecord.phone_number) as string | null
      role = (dataRecord.role || dataRecord.Role) as string | null
      providerType = (dataRecord.providerType || dataRecord.provider_type) as string | null
    }
    
    if (!email) {
      // Check if this is a test webhook with null values
      const isTestWebhook = data.submission && data.submission.questions && 
        data.submission.questions.every((q: FilloutQuestion) => q.value === null);
      
      if (isTestWebhook || Object.keys(data).length === 0) {
        return NextResponse.json({ 
          success: true,
          message: "Test webhook received successfully - no user data to process",
          note: "This appears to be a test webhook with empty values. Real form submissions will contain user data.",
          receivedData: data,
          instructions: "The webhook is configured correctly. When a real form is submitted, it will process the user data."
        });
      }
      
      return NextResponse.json({ 
        error: "Email is required", 
        receivedData: data,
        availableKeys: Object.keys(data),
        note: "The webhook received data but could not find an email field. Please check that your form includes an email field."
      }, { status: 400 });
    }

    // Create admin client with service role key for user creation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists by querying auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);
    
    if (existingUser) {
      // User already exists, just update profile if needed
      // Display name: first name, or "first last", or email username, or "User"
      const fullName = `${firstName || ""} ${lastName || ""}`.trim();
      const displayName = firstName || fullName || email?.split("@")[0] || "User";
      
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: existingUser.id,
          display_name: displayName,
          avatar_url: null,
        }, {
          onConflict: "id"
        });
      
      // Update user metadata with all available fields
      const userMetadata: UserMetadata = {
        ...existingUser.user_metadata,
        source: "fillout",
      };
      
      // Only add fields that have values
      if (firstName) userMetadata.first_name = firstName;
      if (lastName) userMetadata.last_name = lastName;
      if (phone) userMetadata.phone = phone;
      const roleValue = role || providerType;
      if (roleValue) {
        userMetadata.role = roleValue || undefined;
      }
      
      // Update existing user metadata
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: userMetadata,
          phone: phone || undefined,
        }
      );
      
      if (updateError) {
        console.error("User metadata update error:", updateError);
      } else {
        // User metadata updated successfully
      }
      
      if (profileError) {
        console.error("Profile update error:", profileError);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "User already exists, profile updated" 
      });
    }

    // Create display name: prefer first name, then "first last", then email username, then "User"
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    const displayName = firstName || fullName || email.split("@")[0] || "User";
    
    // Create new user with metadata
    const userMetadata: UserMetadata = {
      source: "fillout",
    };
    
    // Only add fields that have values
    if (firstName) userMetadata.first_name = firstName;
    if (lastName) userMetadata.last_name = lastName;
    if (phone) userMetadata.phone = phone;
    if (role || providerType) userMetadata.role = (role || providerType) || undefined;
    
    // Prepare user metadata
    
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm since they came from Fillout
      phone: phone || undefined,
      user_metadata: userMetadata,
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: newUser.user.id,
        display_name: displayName,
        avatar_url: null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't fail the webhook if profile creation fails
    }

    // Welcome email can be sent here if needed

    // User created successfully

    return NextResponse.json({ 
      success: true, 
      message: "User created successfully",
      userId: newUser.user.id 
    });

  } catch (error) {
    console.error("❌ Fillout webhook error:", error);
    console.error("Error details:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

// Add GET endpoint for testing webhook accessibility
export async function GET() {
  return NextResponse.json({
    message: "Fillout webhook endpoint is accessible",
    endpoint: "/api/webhooks/fillout",
    method: "POST",
    note: "This endpoint expects POST requests from Fillout. Use POST to test webhook functionality.",
    webhookUrl: process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fillout`
      : "http://localhost:3000/api/webhooks/fillout"
  });
}
