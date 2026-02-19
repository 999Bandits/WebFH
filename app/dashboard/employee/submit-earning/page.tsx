import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Game } from "@/types/database";
import { calculateNetIncome } from "@/lib/calculations";
import FormattedNumberInput from "@/components/FormattedNumberInput";

export const dynamic = "force-dynamic";

export default async function SubmitEarningPage(props: {
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

  const { data: games } = await supabase
    .from("games")
    .select("id, name, currency_name, current_rate, rate_unit")
    .eq("is_active", true)
    .order("name");

  async function submitEarning(formData: FormData) {
    "use server";

    const gameId = formData.get("game_id") as string;
    const amountFarmed = parseFloat(formData.get("amount_farmed") as string);

    if (!gameId || isNaN(amountFarmed) || amountFarmed <= 0) {
      redirect("/dashboard/employee/submit-earning?error=Silakan isi semua field dengan benar");
    }

    const supabaseServer = await createServerSupabaseClient();

    const {
      data: { session: currentSession },
    } = await supabaseServer.auth.getSession();

    if (!currentSession) {
      redirect("/login");
    }

    const { data: game, error: gameError } = await supabaseServer
      .from("games")
      .select("current_rate, rate_unit")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      console.error("Game fetch error:", gameError);
      redirect("/dashboard/employee/submit-earning?error=Game tidak ditemukan");
    }

    const netIncome = calculateNetIncome(amountFarmed, game.current_rate, game.rate_unit);

    const { error: insertError } = await supabaseServer.from("earnings").insert({
      user_id: currentSession.user.id,
      game_id: gameId,
      amount_farmed: amountFarmed,
      applied_rate: game.current_rate,
      net_income: netIncome,
      status: "pending",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      redirect(`/dashboard/employee/submit-earning?error=Gagal mengajukan: ${insertError.message}`);
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/employee/submit-earning", "layout");
    redirect("/dashboard/employee/submit-earning?success=Pendapatan berhasil diajukan!");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Ajukan Setoran</h1>
          <p className="text-slate-400 mt-2">Ajukan setoran ke Admin</p>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-xl p-8 border border-slate-800">
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

          <form action={submitEarning} className="space-y-6">
            <div>
              <label htmlFor="game_id" className="block text-sm font-medium text-slate-300 mb-2">
                Pilih Game <span className="text-red-400">*</span>
              </label>
              <select
                id="game_id"
                name="game_id"
                required
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base"
              >
                <option value="">Pilih game</option>
                {games?.map((game: Game) => (
                  <option key={game.id} value={game.id}>
                    {game.name} ({game.currency_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount_farmed" className="block text-sm font-medium text-slate-300 mb-2">
                Total Gold <span className="text-red-400">*</span>
              </label>
              <FormattedNumberInput
                id="amount_farmed"
                name="amount_farmed"
                required
                placeholder="Contoh: 10.000.000"
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base"
              />
              <p className="mt-2 text-sm text-slate-500">
                Masukkan total jumlah gold yang Anda dapatkan.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Ajukan setoran
            </button>
          </form>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Cara Kerja</h3>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Pilih game yang Anda mainkan</li>
            <li>Masukkan total jumlah gold yang Anda setorkan</li>
            <li>Setoran Anda akan ditinjau oleh Admin</li>
            <li>Setelah disetujui, akan muncul di pendapatan Anda</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
