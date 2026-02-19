"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveUserWithRole(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const newRole = formData.get("newRole") as string;
    const supabaseServer = await createServerSupabaseClient();

    if (!userId || !newRole) {
      throw new Error("User ID dan Role diperlukan");
    }

    if (!["employee", "admin"].includes(newRole)) {
      throw new Error("Role tidak valid");
    }

    const { error } = await supabaseServer
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user role:", error);
      throw new Error(error.message);
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin/users", "layout");
    revalidatePath("/dashboard/admin", "layout");
  } catch (error) {
    console.error("Failed to update user role:", error);
    throw error;
  }
}
