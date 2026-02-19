import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import EarningForm from "@/components/EarningForm";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
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

  const { data: employees } = await supabase
    .from("users")
    .select("id, name, role")
    .eq("role", "employee")
    .order("name");

  const { data: games } = await supabase
    .from("games")
    .select("id, name, currency_name, current_rate, rate_unit")
    .eq("is_active", true)
    .order("name");

  const { data: pendingEarnings } = await supabase
    .from("earnings")
    .select("*, users(name), games(name, currency_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: recentEarnings } = await supabase
    .from("earnings")
    .select("*, users(name), games(name)")
    .in("status", ["approved", "paid"])
    .order("created_at", { ascending: false })
    .limit(10);

  async function approveEarning(formData: FormData) {
    "use server";
    const earningId = formData.get("earningId") as string;
    const supabaseServer = await createServerSupabaseClient();

    await supabaseServer
      .from("earnings")
      .update({ status: "approved" })
      .eq("id", earningId);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin", "layout");
  }

  async function rejectEarning(formData: FormData) {
    "use server";
    const earningId = formData.get("earningId") as string;
    const supabaseServer = await createServerSupabaseClient();

    await supabaseServer
      .from("earnings")
      .update({ status: "rejected" })
      .eq("id", earningId);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin", "layout");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Total Karyawan</h3>
            <p className="text-3xl font-bold text-white">{employees?.length || 0}</p>
          </div>
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-purple-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Total Game</h3>
            <p className="text-3xl font-bold text-white">{games?.length || 0}</p>
          </div>
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Menunggu Laporan</h3>
            <p className="text-3xl font-bold text-white">{pendingEarnings?.length || 0}</p>
          </div>
        </div>

        {/* SECTION PENDING EARNING REPORTS */}
        {pendingEarnings && pendingEarnings.length > 0 && (
          <div className="mb-8 bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
              Laporan Pendapatan Menunggu
            </h2>
            <div className="space-y-3">
              {pendingEarnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                    <p className="font-medium text-white">
                      {earning.users?.name} mengajukan {earning.amount_farmed.toLocaleString()} {earning.games?.currency_name} untuk {earning.games?.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      Rate: Rp{earning.applied_rate.toLocaleString()} | Pendapatan Bersih: Rp{earning.net_income.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(earning.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <form action={approveEarning}>
                      <input type="hidden" name="earningId" value={earning.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
                      >
                        Setujui
                      </button>
                    </form>
                    <form action={rejectEarning}>
                      <input type="hidden" name="earningId" value={earning.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors"
                      >
                        Tolak
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Earning Form Section */}
          <section>
            <EarningForm users={employees || []} games={games || []} />
          </section>

          {/* Recent Earnings Section (only approved/paid) */}
          <section>
            <div className="bg-slate-900 rounded-xl shadow-xl p-6 h-full border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-6">Riwayat Setoran Lunas</h2>
              {recentEarnings && recentEarnings.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {recentEarnings.map((earning) => (
                    <div key={earning.id} className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{earning.users?.name}</p>
                          <p className="text-sm text-slate-400">{earning.games?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-400">Rp{earning.net_income.toLocaleString()}</p>
                          <p className="text-sm text-slate-500">
                            {earning.amount_farmed.toLocaleString()} @ Rp{earning.applied_rate.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">Belum ada pendapatan yang disetujui.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
