/**
 * Supabase Browser Client
 * 
 * For use in Client Components only.
 * This is safe to use in "use client" components and browser contexts.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser/client-side usage
 * Use this in Client Components ("use client")
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a mock client that will be replaced at runtime
    if (typeof window === "undefined") {
      return createBrowserClient("http://localhost:54321", "mock-key");
    }
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Standardized error handler for authentication operations
 */
export function handleAuthError(error: unknown): never {
  if (error instanceof AuthError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new AuthError(error.message, "unknown_error", 500);
  }

  throw new AuthError("An unexpected error occurred", "unknown_error", 500);
}