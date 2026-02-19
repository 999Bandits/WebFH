"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveUser(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const supabaseServer = await createServerSupabaseClient();

    if (!userId) {
      throw new Error("User ID tidak ditemukan");
    }

    const { error } = await supabaseServer
      .from("users")
      .update({ role: "employee" })
      .eq("id", userId);

    if (error) {
      console.error("Error approving user:", error);
      throw new Error(error.message);
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin", "layout");
  } catch (error) {
    console.error("Failed to approve user:", error);
    throw error;
  }
}
