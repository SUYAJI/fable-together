import { NextResponse } from "next/server";

// This route is disabled for Vercel compatibility
// File system operations are not supported in Vercel serverless environment
export async function POST() {
  return NextResponse.json({ 
    error: "This endpoint is disabled for Vercel compatibility. File system operations are not supported in serverless environment.",
    status: "disabled"
  }, { status: 503 });
}
