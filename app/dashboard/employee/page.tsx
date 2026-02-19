import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Earning, InventoryNeed } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboard() {
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

  const { data: earnings } = await supabase
    .from("earnings")
    .select("*, games(name, currency_name)")
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: pendingEarningsCount } = await supabase
    .from("earnings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", authUser.id)
    .eq("status", "pending");

  const { data: approvedEarnings } = await supabase
    .from("earnings")
    .select("net_income")
    .eq("user_id", authUser.id)
    .in("status", ["approved", "paid"]);

  const totalApprovedEarnings = approvedEarnings?.reduce((sum, e) => sum + (e.net_income || 0), 0) || 0;

  const { data: inventoryRequests } = await supabase
    .from("inventory_needs")
    .select("*")
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: pendingInventoryCount } = await supabase
    .from("inventory_needs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", authUser.id)
    .eq("status", "pending");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
      case "approved":
        return "bg-emerald-900/30 text-emerald-400 border-emerald-700";
      case "fulfilled":
      case "paid":
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
      paid: "Dibayar",
      rejected: "Ditolak"
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Selamat datang, {user?.name}!</h1>
          <p className="text-slate-400 mt-2">Berikut ringkasan dashboard Anda</p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-yellow-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Menunggu Disetujui</h3>
            <p className="text-3xl font-bold text-white">{pendingEarningsCount || 0}</p>
          </div>
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Total Pendapatan</h3>
            <p className="text-3xl font-bold text-white">Rp{totalApprovedEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Total Setoran</h3>
            <p className="text-3xl font-bold text-white">{earnings?.length || 0}</p>
          </div>
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-purple-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Menunggu Permintaan</h3>
            <p className="text-3xl font-bold text-white">{pendingInventoryCount || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Pendapatan Terbaru</h2>
              <a
                href="/dashboard/employee/submit-earning"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                Tambah Setoran →
              </a>
            </div>
            {earnings && earnings.length > 0 ? (
              <div className="space-y-3">
                {earnings.map((earning: Earning) => (
                  <div
                    key={earning.id}
                    className="bg-slate-950 rounded-lg p-4 border border-slate-800"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">
                          {earning.games?.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {earning.amount_farmed.toLocaleString()} {earning.games?.currency_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(earning.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            earning.status
                          )}`}
                        >
                          {getStatusLabel(earning.status)}
                        </span>
                        {earning.status !== "rejected" && (
                          <p className="text-lg font-bold text-emerald-400 mt-1">
                            Rp{earning.net_income.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">Belum ada pendapatan</p>
                <a
                  href="/dashboard/employee/submit-earning"
                  className="inline-block mt-2 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Ajukan pendapatan pertama Anda →
                </a>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Permintaan Inventori Terbaru</h2>
              <a
                href="/dashboard/employee/inventory"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                Minta Barang →
              </a>
            </div>
            {inventoryRequests && inventoryRequests.length > 0 ? (
              <div className="space-y-3">
                {inventoryRequests.map((request: InventoryNeed) => (
                  <div
                    key={request.id}
                    className="bg-slate-950 rounded-lg p-4 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-white">{request.item_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">Belum ada permintaan</p>
                <a
                  href="/dashboard/employee/inventory"
                  className="inline-block mt-2 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Minta barang pertama Anda →
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
