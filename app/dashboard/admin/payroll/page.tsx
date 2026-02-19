import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Earning } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
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

  const { data: unpaidEarnings } = await supabase
    .from("earnings")
    .select("*, users(name, bank_name, bank_account), games(name, currency_name)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const { data: paidEarnings } = await supabase
    .from("earnings")
    .select("*, users(name, bank_name, bank_account), games(name, currency_name)")
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  const totalUnpaid = unpaidEarnings?.reduce((sum, e) => sum + (e.net_income || 0), 0) || 0;
  const totalPaid = paidEarnings?.reduce((sum, e) => sum + (e.net_income || 0), 0) || 0;

  async function markAsPaid(formData: FormData) {
    "use server";
    const earningId = formData.get("earningId") as string;
    const supabaseServer = await createServerSupabaseClient();

    await supabaseServer
      .from("earnings")
      .update({ status: "paid" })
      .eq("id", earningId);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/admin/payroll", "layout");
  }

  const formatCurrency = (amount: number) => {
    return `Rp${amount.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getBankInfo = (bankName: string | null, bankAccount: string | null) => {
    if (bankName && bankAccount) {
      return `${bankName} - ${bankAccount}`;
    }
    return "Cash/Tunai";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Manajemen Penggajian</h1>
          <p className="text-slate-400 mt-1">Kelola dan pantau pembayaran gaji karyawan</p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-orange-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Total Belum Dibayar</h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalUnpaid)}</p>
            <p className="text-sm text-slate-500 mt-1">{unpaidEarnings?.length || 0} transaksi</p>
          </div>
          <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800 border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Total Sudah Dibayar</h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalPaid)}</p>
            <p className="text-sm text-slate-500 mt-1">{paidEarnings?.length || 0} transaksi</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 mb-8">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Belum Dibayar</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Daftar pendapatan yang telah disetujui dan menunggu pembayaran
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-900/30 text-orange-400 border border-orange-700">
                {unpaidEarnings?.length || 0} Transaksi
              </span>
            </div>
          </div>

          <div className="p-6">
            {unpaidEarnings && unpaidEarnings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Nama Karyawan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Info Rekening
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Game
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Jumlah Difarm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Pendapatan Bersih
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-800">
                    {unpaidEarnings.map((earning: Earning & { users?: { name: string; bank_name: string | null; bank_account: string | null } }) => (
                      <tr key={earning.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {earning.users?.name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {getBankInfo(earning.users?.bank_name || null, earning.users?.bank_account || null)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{earning.games?.name}</div>
                          <div className="text-xs text-slate-500">
                            {earning.games?.currency_name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {earning.amount_farmed.toLocaleString("id-ID")}
                          </div>
                          <div className="text-xs text-slate-500">
                            Rate: Rp{earning.applied_rate.toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-400">
                            {formatCurrency(earning.net_income)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {formatDate(earning.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <form action={markAsPaid}>
                            <input type="hidden" name="earningId" value={earning.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Lunas
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-slate-500 text-lg mt-4">Tidak ada pembayaran yang tertunda</p>
                <p className="text-slate-600 text-sm mt-1">
                  Semua pendapatan yang disetujui telah dibayar
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Riwayat Lunas</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Daftar pembayaran yang telah selesai dilakukan
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700">
                {paidEarnings?.length || 0} Transaksi
              </span>
            </div>
          </div>

          <div className="p-6">
            {paidEarnings && paidEarnings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Nama Karyawan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Info Rekening
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Game
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Jumlah Difarm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Pendapatan Bersih
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-800">
                    {paidEarnings.map((earning: Earning & { users?: { name: string; bank_name: string | null; bank_account: string | null } }) => (
                      <tr key={earning.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {earning.users?.name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {getBankInfo(earning.users?.bank_name || null, earning.users?.bank_account || null)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{earning.games?.name}</div>
                          <div className="text-xs text-slate-500">
                            {earning.games?.currency_name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {earning.amount_farmed.toLocaleString("id-ID")}
                          </div>
                          <div className="text-xs text-slate-500">
                            Rate: Rp{earning.applied_rate.toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-400">
                            {formatCurrency(earning.net_income)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {formatDate(earning.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Lunas
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-slate-600"
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
                <p className="text-slate-500 text-lg mt-4">Belum ada riwayat pembayaran</p>
                <p className="text-slate-600 text-sm mt-1">
                  Riwayat pembayaran akan muncul setelah Anda menandai pendapatan sebagai lunas
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
