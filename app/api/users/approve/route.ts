import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify admin role
  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminUser?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get form data
  const formData = await request.formData();
  const userId = formData.get("userId") as string;

  if (!userId) {
    redirect("/dashboard/admin?error=User ID is required");
  }

  // Update user role from pending to employee
  const { error } = await supabase
    .from("users")
    .update({ role: "employee" })
    .eq("id", userId)
    .eq("role", "pending"); // Only update if role is pending

  if (error) {
    console.error("Error approving user:", error);
    redirect("/dashboard/admin?error=Failed to approve user");
  }

  // Redirect back to admin dashboard
  redirect("/dashboard/admin?success=User approved successfully");
}