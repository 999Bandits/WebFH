import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { id } = params;

    if (!id) {
        redirect("/dashboard/employee?error=Item+ID+is+required");
    }

    // Update inventory item to mark as purchased
    const { error } = await supabase
        .from("inventory_needs")
        .update({ is_purchased: true })
        .eq("id", id);

    if (error) {
        console.error("Error marking item as purchased:", error);
        redirect("/dashboard/employee?error=Failed+to+mark+item+as+purchased");
    }

    // Redirect back to employee dashboard
    redirect("/dashboard/employee");
}
