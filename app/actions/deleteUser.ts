"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export async function deleteUser(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    
    if (!userId) {
      throw new Error("User ID diperlukan");
    }

    const supabaseServer = await createServerSupabaseClient();
    
    const {
      data: { session },
    } = await supabaseServer.auth.getSession();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const { data: currentUser } = await supabaseServer
      .from("users")
      .select("id, role")
      .eq("id", session.user.id)
      .single();

    if (currentUser?.role !== "admin") {
      throw new Error("Hanya admin yang dapat menghapus pengguna");
    }

    if (currentUser?.id === userId) {
      throw new Error("Tidak dapat menghapus diri sendiri");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase admin configuration");
    }

    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, serviceRoleKey);

    // First delete related database records
    await supabaseServer.from("admin_users").delete().eq("user_id", userId);
    await supabaseServer.from("earnings").delete().eq("user_id", userId);
    await supabaseServer.from("inventory_needs").delete().eq("user_id", userId);
    
    // Delete from users table
    await supabaseServer.from("users").delete().eq("id", userId);

    // Finally delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Auth delete error:", authError);
      // Continue even if auth delete fails - user record is already deleted
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin/users", "layout");
    revalidatePath("/dashboard/admin", "layout");
  } catch (error) {
    console.error("Delete user error:", error);
    throw error;
  }
}
