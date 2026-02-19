/**
 * Supabase Client Utilities
 * 
 * This module exports Supabase client utilities for different contexts.
 * Import from the specific submodule based on your use case:
 * 
 * - Browser/Client Components: import { createClient } from "@/lib/supabase/client"
 * - Server Components: import { createServerSupabaseClient } from "@/lib/supabase/server"
 * - Middleware: import { createMiddlewareClient } from "@/lib/supabase/middleware"
 */

// Re-export types and utilities that are context-agnostic
export { AuthError, handleAuthError } from "./client";