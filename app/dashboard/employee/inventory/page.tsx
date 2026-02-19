import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { InventoryNeed } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function InventoryPage(props: { 
  searchParams: Promise<{ error?: string; success?: string }> 
}) {
  const searchParams = await props.searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", authUser.id)
    .single();

  if (user?.role !== "employee") {
    redirect("/dashboard/admin");
  }

  const { data: inventoryRequests } = await supabase
    .from("inventory_needs")
    .select("*")
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false });

  async function requestItem(formData: FormData) {
    "use server";
    
    const itemName = (formData.get("item_name") as string)?.trim();

    if (!itemName || itemName.length < 2) {
      redirect("/dashboard/employee/inventory?error=Masukkan nama barang yang valid");
    }

    const supabaseServer = await createServerSupabaseClient();

    const {
      data: { session: currentSession },
    } = await supabaseServer.auth.getSession();

    if (!currentSession) {
      redirect("/login");
    }

    const { error: insertError } = await supabaseServer.from("inventory_needs").insert({
      user_id: currentSession.user.id,
      item_name: itemName,
      status: "pending",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      redirect(`/dashboard/employee/inventory?error=Gagal meminta: ${insertError.message}`);
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/employee/inventory", "layout");
    redirect("/dashboard/employee/inventory?success=Barang berhasil diminta!");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
      case "approved":
        return "bg-emerald-900/30 text-emerald-400 border-emerald-700";
      case "fulfilled":
        return "bg-blue-900/30 text-blue-400 border-blue-700";
      case "rejected":
        return "bg-red-900/30 text-red-400 border-red-700";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Menunggu",
      approved: "Disetujui",
      fulfilled: "Dipenuhi",
      rejected: "Ditolak"
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Permintaan Inventori</h1>
          <p className="text-slate-400 mt-2">Minta barang yang Anda butuhkan untuk pekerjaan</p>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-xl p-8 mb-8 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6">Minta Barang Baru</h2>
          
          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
              {searchParams.error}
            </div>
          )}
          {searchParams.success && (
            <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg text-emerald-300">
              {searchParams.success}
            </div>
          )}
          
          <form action={requestItem} className="space-y-6">
            <div>
              <label htmlFor="item_name" className="block text-sm font-medium text-slate-300 mb-2">
                Nama Barang <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="item_name"
                name="item_name"
                required
                minLength={2}
                placeholder="Contoh: Telur, Beras, Perlengkapan Kantor"
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base"
              />
              <p className="mt-2 text-sm text-slate-500">
                Masukkan nama barang yang Anda butuhkan
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Minta Barang
            </button>
          </form>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">Permintaan Saya</h2>
          
          {inventoryRequests && inventoryRequests.length > 0 ? (
            <div className="space-y-3">
              {inventoryRequests.map((request: InventoryNeed) => (
                <div
                  key={request.id}
                  className="bg-slate-950 rounded-lg p-4 border border-slate-800"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{request.item_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Belum ada permintaan</p>
              <p className="text-sm text-slate-600 mt-1">
                Gunakan formulir di atas untuk meminta barang yang Anda butuhkan
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm text-slate-400">Menunggu</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-sm text-slate-400">Disetujui</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm text-slate-400">Dipenuhi</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm text-slate-400">Ditolak</span>
          </div>
        </div>
      </main>
    </div>
  );
}
