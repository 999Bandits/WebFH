import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Missing+auth+code", request.url)
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL("/login?error=Auth+Failed", request.url)
      );
    }

    // Success! Redirect to dashboard
    // Middleware will handle routing to /pending, /dashboard/admin, or /dashboard/employee
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Auth callback exception:", err);
    return NextResponse.redirect(
      new URL("/login?error=Auth+Failed", request.url)
    );
  }
}