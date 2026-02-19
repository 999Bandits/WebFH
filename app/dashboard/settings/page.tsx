import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath, unstable_noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SettingsPage(props: { searchParams: Promise<{ error?: string; success?: string }> }) {
    unstable_noStore();
    const searchParams = await props.searchParams;
    const supabase = await createServerSupabaseClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, role, bank_name, bank_account")
        .eq("id", session.user.id)
        .single();

    if (userError) {
        console.error("Error fetching user:", userError);
    }

    if (!user) {
        redirect("/login");
    }

    const getRoleLabel = (role: string) => {
        const labels: { [key: string]: string } = {
            admin: "Admin",
            employee: "Karyawan",
            pending: "Menunggu"
        };
        return labels[role] || role;
    };

    async function updateProfile(formData: FormData) {
        "use server";
        const newName = (formData.get("name") as string)?.trim();
        const bankName = (formData.get("bank_name") as string)?.trim();
        const bankAccount = (formData.get("bank_account") as string)?.trim();

        if (!newName || newName.length < 2) {
            redirect("/dashboard/settings?error=Nama minimal 2 karakter");
        }

        const supabaseServer = await createServerSupabaseClient();

        const {
            data: { session: currentSession },
        } = await supabaseServer.auth.getSession();

        if (!currentSession) {
            redirect("/dashboard/settings?error=Sesi berakhir. Silakan masuk kembali.");
        }

        const updateData: { name: string; bank_name?: string; bank_account?: string } = { name: newName };
        
        if (bankName) {
            updateData.bank_name = bankName;
        }
        if (bankAccount) {
            updateData.bank_account = bankAccount;
        }

        const { error } = await supabaseServer
            .from("users")
            .update(updateData)
            .eq("id", currentSession.user.id);

        if (error) {
            console.error("Failed to update profile:", error);
            redirect(`/dashboard/settings?error=Gagal memperbarui: ${error.message}`);
        }

        revalidatePath("/dashboard", "layout");
        revalidatePath("/dashboard/admin", "layout");
        revalidatePath("/dashboard/employee", "layout");
        revalidatePath("/dashboard/settings", "layout");
        redirect("/dashboard/settings?success=Profil berhasil diperbarui!");
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-slate-900 rounded-xl shadow-xl p-8 border border-slate-800">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                Pengaturan Profil
                            </h2>
                            <p className="text-sm text-slate-400">
                                Perbarui informasi akun Anda
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 mb-1">Email</p>
                                <p className="font-medium text-white">
                                    {session.user.email}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 mb-1">Peran</p>
                                <p className="font-medium text-white">
                                    {getRoleLabel(user.role)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {searchParams.error && (
                        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
                            {searchParams.error}
                        </div>
                    )}
                    {searchParams.success && (
                        <div className="mb-4 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg text-emerald-300">
                            {searchParams.success}
                        </div>
                    )}

                    <form action={updateProfile} className="space-y-5">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-slate-300 mb-1"
                            >
                                Nama Lengkap <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                minLength={2}
                                maxLength={100}
                                defaultValue={user.name}
                                placeholder="Masukkan nama lengkap Anda"
                                className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <p className="mt-1.5 text-xs text-slate-500">
                                Nama ini akan ditampilkan di seluruh dashboard dan di catatan pendapatan.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <h3 className="text-lg font-medium text-white mb-4">Informasi Bank</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="bank_name"
                                        className="block text-sm font-medium text-slate-300 mb-1"
                                    >
                                        Nama Bank <span className="text-slate-500">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="bank_name"
                                        name="bank_name"
                                        defaultValue={user.bank_name || ""}
                                        placeholder="Contoh: BCA, BRI, Mandiri"
                                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="bank_account"
                                        className="block text-sm font-medium text-slate-300 mb-1"
                                    >
                                        Nomor Rekening <span className="text-slate-500">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="bank_account"
                                        name="bank_account"
                                        defaultValue={user.bank_account || ""}
                                        placeholder="Contoh: 1234567890"
                                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        Digunakan untuk transfer pembayaran gaji. Jika kosong, pembayaran akan dilakukan secara tunai.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            Simpan Perubahan
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
