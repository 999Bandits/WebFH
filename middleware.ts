import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Next.js Middleware for Route Protection and Role-Based Access Control
 * 
 * This middleware:
 * 1. Protects /dashboard routes - redirects to /login if not authenticated
 * 2. Fetches user role and enforces access control
 * 3. Redirects employees from /dashboard/admin to /dashboard/employee
 * 4. Refreshes Supabase session automatically
 */

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard"];

// Admin-only routes
const ADMIN_ROUTES = ["/dashboard/admin"];

// Public routes (no authentication required)
const PUBLIC_ROUTES = ["/login", "/pending", "/auth/callback", "/_next", "/api"];

// Routes that pending users can access
const PENDING_ALLOWED_ROUTES = ["/pending"];

/**
 * Check if a path is protected (requires authentication)
 */
function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Check if a path is admin-only
 */
function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Check if a path is public (no auth required)
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Create Supabase client with cookie handling
  const { supabase, response } = createMiddlewareClient(request);

  try {
    // Refresh session if expired - this also sets the auth cookies on the response
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
    }

    console.log(`Middleware: ${pathname} - Session: ${!!session}`);

    // If accessing protected route without session, redirect to login
    if (isProtectedRoute(pathname) && !session) {
      console.log("No session, redirecting to login");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      // Important: Return the response that contains the supabase auth cookies
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Copy cookies from supabase response to redirect response
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    // If user is logged in and accessing protected routes, check role
    if (session && isProtectedRoute(pathname)) {
      console.log("Session found, checking role for:", session.user.email);

      // Fetch user role from the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle(); // <-- KUNCI PERBAIKAN: Gunakan maybeSingle agar tidak crash jika kosong

      if (userError || !userData) {
        console.error("Error/User not found in public.users:", userError);
        
        // Bawa pesan error ke halaman login agar kita tahu masalahnya
        const loginUrl = new URL("/login?error=Akun+belum+didaftarkan+ke+tabel+users+oleh+Admin", request.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
      }

      const userRole = userData?.role;
      console.log("User role:", userRole);

      let redirectUrl: URL | null = null;

      // If user has pending role, redirect to pending page
      if (userRole === "pending") {
        // Allow access to pending page, but redirect away from dashboard
        if (!PENDING_ALLOWED_ROUTES.some(route => pathname.startsWith(route))) {
          redirectUrl = new URL("/pending", request.url);
        }
      }
      // If employee tries to access admin routes, redirect to employee dashboard
      else if (isAdminRoute(pathname) && userRole === "employee") {
        redirectUrl = new URL("/dashboard/employee", request.url);
      }
      // If admin accessing /dashboard, redirect to /dashboard/admin
      else if (pathname === "/dashboard" && userRole === "admin") {
        redirectUrl = new URL("/dashboard/admin", request.url);
      }
      // If employee accessing /dashboard, redirect to /dashboard/employee
      else if (pathname === "/dashboard" && userRole === "employee") {
        redirectUrl = new URL("/dashboard/employee", request.url);
      }

      if (redirectUrl) {
        console.log("Role-based redirect to:", redirectUrl.pathname);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        // Copy cookies from the response to the redirect
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
      }
    }

    // Return the response with updated cookies (this is crucial for auth to work)
    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // On error, redirect to login for protected routes
    if (isProtectedRoute(pathname)) {
      const loginUrl = new URL("/login", request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    return NextResponse.next();
  }
}

/**
 * Middleware configuration
 * Match all routes except static files and API routes that handle their own auth
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};