/**
 * Supabase Middleware Client
 * 
 * For use in Next.js Middleware only.
 * Handles request/response cookie synchronization.
 */

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function validateEnv(): void {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
}

/**
 * Creates a Supabase client for Next.js Middleware
 * Handles cookie management for request/response cycle
 * 
 * Usage:
 * const { supabase, response } = createMiddlewareClient(request);
 * const { data: { session } } = await supabase.auth.getSession();
 */
export function createMiddlewareClient(request: NextRequest) {
  validateEnv();
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Set cookie on request for subsequent middleware
          request.cookies.set(name, value);
          // Set cookie on response for browser
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}