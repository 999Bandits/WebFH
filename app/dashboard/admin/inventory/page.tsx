import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { InventoryNeed } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage(props: { 
  searchParams: Promise<{ status?: string }> 
}) {
  const searchParams = await props.searchParams;
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", session.user.id)
    .single();

  if (user?.role !== "admin") {
    redirect("/dashboard/employee");
  }

  const statusFilter = searchParams.status || "all";

  let query = supabase
    .from("inventory_needs")
    .select("*, users(name)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: inventoryRequests } = await query;

  const { count: pendingCount } = await supabase
    .from("inventory_needs")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: approvedCount } = await supabase
    .from("inventory_needs")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: fulfilledCount } = await supabase
    .from("inventory_needs")
    .select("*", { count: "exact", head: true })
    .eq("status", "fulfilled");

  const { count: rejectedCount } = await supabase
    .from("inventory_needs")
    .select("*", { count: "exact", head: true })
    .eq("status", "rejected");

  async function approveRequest(formData: FormData) {
    "use server";
    const requestId = formData.get("requestId") as string;
    const supabaseServer = await createServerSupabaseClient();

    await supabaseServer
      .from("inventory_needs")
      .update({ status: "approved" })
      .eq("id", requestId);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin/inventory", "layout");
  }

  async function fulfillRequest(formData: FormData) {
    "use server";
    const requestId = formData.get("requestId") as string;
    const supabaseServer = await createServerSupabaseClient();

    await supabaseServer
      .from("inventory_needs")
      .update({ status: "fulfilled" })
      .eq("id", requestId);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin/inventory", "layout");
  }

  async function rejectRequest(formData: FormData) {
    "use server";
    const requestId = formData.get("requestId") as string;
    const supabaseServer = await createServerSupabaseClient();

    await supabaseServer
      .from("inventory_needs")
      .update({ status: "rejected" })
      .eq("id", requestId);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin/inventory", "layout");
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Kelola Permintaan Inventori</h1>
          <p className="text-slate-400 mt-1">Tinjau dan kelola permintaan inventori karyawan</p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <a 
            href="/dashboard/admin/inventory?status=all"
            className="rounded-xl shadow-xl p-4 border transition-colors bg-slate-900 border-slate-800 hover:bg-slate-800"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-1">Semua Permintaan</h3>
            <p className="text-3xl font-bold text-white">{(pendingCount || 0) + (approvedCount || 0) + (fulfilledCount || 0) + (rejectedCount || 0)}</p>
          </a>
          <a 
            href="/dashboard/admin/inventory?status=pending"
            className={`rounded-xl shadow-xl p-4 border transition-colors bg-slate-900 border-slate-800 hover:bg-slate-800 ${statusFilter === "pending" ? "border-yellow-500" : "border-slate-700"}`}
          >
            <h3 className="text-sm font-medium text-slate-400 mb-1">Menunggu</h3>
            <p className="text-3xl font-bold text-white">{pendingCount || 0}</p>
          </a>
          <a 
            href="/dashboard/admin/inventory?status=approved"
            className={`rounded-xl shadow-xl p-4 border transition-colors bg-slate-900 border-slate-800 hover:bg-slate-800 ${statusFilter === "approved" ? "border-emerald-500" : "border-slate-700"}`}
          >
            <h3 className="text-sm font-medium text-slate-400 mb-1">Disetujui</h3>
            <p className="text-3xl font-bold text-white">{approvedCount || 0}</p>
          </a>
          <a 
            href="/dashboard/admin/inventory?status=fulfilled"
            className={`rounded-xl shadow-xl p-4 border transition-colors bg-slate-900 border-slate-800 hover:bg-slate-800 ${statusFilter === "fulfilled" ? "border-blue-500" : "border-slate-700"}`}
          >
            <h3 className="text-sm font-medium text-slate-400 mb-1">Dipenuhi</h3>
            <p className="text-3xl font-bold text-white">{fulfilledCount || 0}</p>
          </a>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href="/dashboard/admin/inventory?status=all"
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === "all" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Semua
          </a>
          <a
            href="/dashboard/admin/inventory?status=pending"
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === "pending" 
                ? "bg-yellow-600 text-white border-yellow-600" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Menunggu
          </a>
          <a
            href="/dashboard/admin/inventory?status=approved"
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === "approved" 
                ? "bg-emerald-600 text-white border-emerald-600" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Disetujui
          </a>
          <a
            href="/dashboard/admin/inventory?status=fulfilled"
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === "fulfilled" 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Dipenuhi
          </a>
          <a
            href="/dashboard/admin/inventory?status=rejected"
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === "rejected" 
                ? "bg-red-600 text-white border-red-600" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Ditolak
          </a>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            {statusFilter === "all" ? "Semua Permintaan" : `Permintaan ${getStatusLabel(statusFilter)}`}
          </h2>
          
          {inventoryRequests && inventoryRequests.length > 0 ? (
            <div className="space-y-3">
              {inventoryRequests.map((request: InventoryNeed) => (
                <div
                  key={request.id}
                  className="bg-slate-950 rounded-lg p-4 border border-slate-800"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{request.users?.name}</span>
                        <span className="text-slate-500">meminta</span>
                        <span className="font-medium text-slate-300">{request.item_name}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {request.status === "pending" && (
                          <>
                            <form action={approveRequest}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <button 
                                type="submit" 
                                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
                              >
                                Setuju
                              </button>
                            </form>
                            <form action={fulfillRequest}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <button 
                                type="submit" 
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                              >
                                Penuhi
                              </button>
                            </form>
                            <form action={rejectRequest}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <button 
                                type="submit" 
                                className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors"
                              >
                                Tolak
                              </button>
                            </form>
                          </>
                        )}
                        
                        {request.status === "approved" && (
                          <form action={fulfillRequest}>
                            <input type="hidden" name="requestId" value={request.id} />
                            <button 
                              type="submit" 
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                            >
                              Tandai Dipenuhi
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">Tidak ada permintaan</p>
              <p className="text-slate-600 text-sm mt-1">
                {statusFilter === "all" 
                  ? "Belum ada permintaan inventori" 
                  : `Tidak ada permintaan ${getStatusLabel(statusFilter)}`}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
