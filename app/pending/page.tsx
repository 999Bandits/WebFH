import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // If not logged in, redirect to login
  if (!authUser) {
    redirect("/login");
  }

  // Check user role
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .maybeSingle();

  // If user is already approved (not pending), redirect to dashboard
  if (user?.role && user.role !== "pending") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-cream px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-pearl-grey rounded-xl shadow-lg p-8 text-center">
          {/* Hourglass Icon */}
          <div className="mx-auto h-20 w-20 bg-soft-coral/20 rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-10 w-10 text-soft-coral"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Menunggu Persetujuan
          </h2>

          <p className="text-gray-600 mb-6">
            Akun Anda sedang menunggu persetujuan Admin.
            Anda akan mendapatkan akses setelah akun disetujui.
          </p>

          <div className="bg-ivory-cream rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Email:</p>
            <p className="font-medium text-gray-900">{authUser.email}</p>
          </div>

          <div className="mt-6">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-calm-sky-blue hover:text-blue-700 text-sm font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}