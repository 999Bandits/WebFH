import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ArchiveGameButton from "./ArchiveGameButton";
import FormattedNumberInput from "@/components/FormattedNumberInput";

export const dynamic = "force-dynamic";

export default async function ManageGamesPage(props: { searchParams: Promise<{ edit?: string }> }) {
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

    const { data: games } = await supabase
        .from("games")
        .select("id, name, currency_name, current_rate, rate_unit")
        .eq("is_active", true)
        .order("name");

    const editingGameId = searchParams.edit;
    const editingGame = games?.find(g => g.id === editingGameId);

    async function addGame(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        const currencyName = formData.get("currency_name") as string;
        const currentRate = parseFloat(formData.get("current_rate") as string);
        const rateUnit = parseInt(formData.get("rate_unit") as string, 10);

        if (!name || !currencyName || isNaN(currentRate) || currentRate <= 0 || isNaN(rateUnit) || rateUnit <= 0) {
            return;
        }

        const supabaseServer = await createServerSupabaseClient();

        await supabaseServer.from("games").insert({
            name,
            currency_name: currencyName,
            current_rate: currentRate,
            rate_unit: rateUnit,
        });

        revalidatePath("/dashboard", "layout");
        revalidatePath("/dashboard/admin/games", "layout");
        revalidatePath("/dashboard/admin", "layout");
    }

    async function updateGame(formData: FormData) {
        "use server";
        const gameId = formData.get("gameId") as string;
        const name = formData.get("name") as string;
        const currencyName = formData.get("currency_name") as string;
        const currentRate = parseFloat(formData.get("current_rate") as string);
        const rateUnit = parseInt(formData.get("rate_unit") as string, 10);

        if (!gameId || !name || !currencyName || isNaN(currentRate) || currentRate <= 0 || isNaN(rateUnit) || rateUnit <= 0) {
            return;
        }

        const supabaseServer = await createServerSupabaseClient();

        await supabaseServer
            .from("games")
            .update({
                name,
                currency_name: currencyName,
                current_rate: currentRate,
                rate_unit: rateUnit,
            })
            .eq("id", gameId);

        revalidatePath("/dashboard", "layout");
        revalidatePath("/dashboard/admin/games", "layout");
        revalidatePath("/dashboard/admin", "layout");
        redirect("/dashboard/admin/games");
    }

    async function archiveGame(formData: FormData) {
        "use server";
        const gameId = formData.get("gameId") as string;
        console.log("[Server Action] Attempting to archive game with ID:", gameId);

        if (!gameId) {
            console.error("[Server Action] Error: No gameId provided");
            return;
        }

        const supabaseServer = await createServerSupabaseClient();

        try {
            const { error } = await supabaseServer.from("games").update({ is_active: false }).eq("id", gameId);

            if (error) {
                console.error("[Server Action] Supabase Archive Error:", error);
                throw error;
            }

            console.log("[Server Action] Game archived successfully");
            revalidatePath("/dashboard", "layout");
            revalidatePath("/dashboard/admin/games", "layout");
            revalidatePath("/dashboard/admin", "layout");
        } catch (error) {
            console.error("[Server Action] Unexpected error during archiving:", error);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Add Game Form - Only show when not editing */}
                {!editingGame && (
                    <div className="bg-slate-900 rounded-xl shadow-xl p-6 mb-8 border border-slate-800">
                        <h2 className="text-xl font-semibold text-white mb-6">Tambah Game Baru</h2>

                        <form action={addGame} className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                                    Nama Game <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="Contoh: Aion 2"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="currency_name" className="block text-sm font-medium text-slate-300 mb-1">
                                    Nama Mata Uang <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="currency_name"
                                    name="currency_name"
                                    required
                                    placeholder="Contoh: Kinah, Gold"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="current_rate" className="block text-sm font-medium text-slate-300 mb-1">
                                    Harga Rate (Rp) <span className="text-red-400">*</span>
                                </label>
                                <FormattedNumberInput
                                    id="current_rate"
                                    name="current_rate"
                                    required
                                    placeholder="Contoh: 10.000"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Ini adalah harga dalam Rupiah untuk unit rate yang ditentukan dari mata uang dalam game.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="rate_unit" className="block text-sm font-medium text-slate-300 mb-1">
                                    Unit per Rate <span className="text-red-400">*</span>
                                </label>
                                <FormattedNumberInput
                                    id="rate_unit"
                                    name="rate_unit"
                                    required
                                    placeholder="Contoh: 1.000.000 untuk 1M, 1.000 untuk 1K"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Unit mata uang yang berlaku untuk rate ini. Gunakan 1.000.000 untuk per 1 Juta, 1.000 untuk per 1 Ribu, dll.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                Tambah Game
                            </button>
                        </form>
                    </div>
                )}

                {/* Edit Game Form - Show when editing */}
                {editingGame && (
                    <div className="bg-slate-900 rounded-xl shadow-xl p-6 mb-8 border-2 border-blue-600">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Edit Game</h2>
                            <a
                                href="/dashboard/admin/games"
                                className="text-sm text-slate-400 hover:text-white underline"
                            >
                                Batal
                            </a>
                        </div>

                        <form action={updateGame} className="space-y-5">
                            <input type="hidden" name="gameId" value={editingGame.id} />

                            <div>
                                <label htmlFor="edit_name" className="block text-sm font-medium text-slate-300 mb-1">
                                    Nama Game <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="edit_name"
                                    name="name"
                                    required
                                    defaultValue={editingGame.name}
                                    placeholder="Contoh: Aion 2"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="edit_currency_name" className="block text-sm font-medium text-slate-300 mb-1">
                                    Nama Mata Uang <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="edit_currency_name"
                                    name="currency_name"
                                    required
                                    defaultValue={editingGame.currency_name}
                                    placeholder="Contoh: Kinah, Gold"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="edit_current_rate" className="block text-sm font-medium text-slate-300 mb-1">
                                    Harga Rate (Rp) <span className="text-red-400">*</span>
                                </label>
                                <FormattedNumberInput
                                    id="edit_current_rate"
                                    name="current_rate"
                                    required
                                    defaultValue={editingGame.current_rate}
                                    placeholder="Contoh: 10.000"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Ini adalah harga dalam Rupiah untuk unit rate yang ditentukan dari mata uang dalam game.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="edit_rate_unit" className="block text-sm font-medium text-slate-300 mb-1">
                                    Unit per Rate <span className="text-red-400">*</span>
                                </label>
                                <FormattedNumberInput
                                    id="edit_rate_unit"
                                    name="rate_unit"
                                    required
                                    defaultValue={editingGame.rate_unit}
                                    placeholder="Contoh: 1.000.000 untuk 1M, 1.000 untuk 1K"
                                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Unit mata uang yang berlaku untuk rate ini. Gunakan 1.000.000 untuk per 1 Juta, 1.000 untuk per 1 Ribu, dll.
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    Simpan Perubahan
                                </button>
                                <a
                                    href="/dashboard/admin/games"
                                    className="flex-1 flex justify-center py-3 px-4 border border-slate-600 rounded-lg shadow-sm text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
                                >
                                    Batal
                                </a>
                            </div>
                        </form>
                    </div>
                )}

                {/* Existing Games Table */}
                <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
                    <h2 className="text-xl font-semibold text-white mb-6">Game Aktif</h2>

                    {games && games.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-700">
                                        <th className="text-left text-sm font-semibold text-slate-400 uppercase py-3 pr-4">Game</th>
                                        <th className="text-left text-sm font-semibold text-slate-400 uppercase py-3 pr-4">Mata Uang</th>
                                        <th className="text-right text-sm font-semibold text-slate-400 uppercase py-3 pr-4">Rate</th>
                                        <th className="text-right text-sm font-semibold text-slate-400 uppercase py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {games.map((game) => (
                                        <tr key={game.id} className={`border-b border-slate-800 last:border-0 hover:bg-slate-800/50 ${editingGame?.id === game.id ? 'bg-blue-900/20' : ''}`}>
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-white">{game.name}</p>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                                                    {game.currency_name}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 text-right">
                                                <p className="font-mono font-medium text-white">
                                                    Rp{Number(game.current_rate).toLocaleString("id-ID")} / {Number(game.rate_unit).toLocaleString("id-ID")}
                                                </p>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <a
                                                        href={`/dashboard/admin/games?edit=${game.id}`}
                                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </a>

                                                    <form action={archiveGame} className="inline">
                                                        <input type="hidden" name="gameId" value={game.id} />
                                                        <ArchiveGameButton gameName={game.name} />
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-500">Belum ada game yang ditambahkan.</p>
                            <p className="text-sm text-slate-600 mt-1">
                                Gunakan formulir di atas untuk menambahkan game pertama Anda.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
