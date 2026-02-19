"use client";

import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [user, setUser] = useState<{ role: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                redirect("/login");
                return;
            }

            const { data: userData } = await supabase
                .from("users")
                .select("role, name")
                .eq("id", session.user.id)
                .single();

            if (!userData) {
                redirect("/login");
                return;
            }

            setUser(userData);
            setLoading(false);
        }

        checkAuth();
    }, []);

    const isAdmin = user?.role === "admin";

    const getRoleLabel = (role: string) => {
        const labels: { [key: string]: string } = {
            admin: "Admin",
            employee: "Karyawan",
            pending: "Menunggu"
        };
        return labels[role] || role;
    };

    const isActive = (href: string) => pathname === href;

    if (loading) {
        return <div className="flex h-screen bg-slate-950 items-center justify-center"><div className="text-slate-400">Loading...</div></div>;
    }

    return (
        <div className="flex h-screen bg-slate-950">
            {/* Left Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col fixed h-screen">
                {/* Logo / Brand */}
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white">SGH</h1>
                    <p className="text-xs text-slate-400 mt-1">Dashboard Gajian</p>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6 px-4 space-y-1">
                    {/* Dashboard Link - for all users */}
                    <Link
                        href="/dashboard"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard")
                            ? "bg-blue-600/20 text-blue-400"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    {/* Payroll - Admin only */}
                    {isAdmin && (
                        <Link
                            href="/dashboard/admin/payroll"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/admin/payroll")
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                            <span className="font-medium">Pembayaran</span>
                        </Link>
                    )}

                    {/* Submissions - Admin only */}
                    {isAdmin && (
                        <Link
                            href="/dashboard/admin/submissions"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/admin/submissions")
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <span className="font-medium">Setoran</span>
                        </Link>
                    )}

                    {/* Inventory - Admin only */}
                    {isAdmin && (
                        <Link
                            href="/dashboard/admin/inventory"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/admin/inventory")
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="font-medium">Inventori</span>
                        </Link>
                    )}

                    {/* Submit Earning - Employee only */}
                    {!isAdmin && (
                        <Link
                            href="/dashboard/employee/submit-earning"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/employee/submit-earning")
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="font-medium">Ajukan Setoran</span>
                        </Link>
                    )}

                    {/* Inventory - Employee only */}
                    {!isAdmin && (
                        <Link
                            href="/dashboard/employee/inventory"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/employee/inventory")
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="font-medium">Inventori</span>
                        </Link>
                    )}

                    {/* Manage Games - Admin only */}
                    {isAdmin && (
                        <Link
                            href="/dashboard/admin/games"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/admin/games")
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                            </svg>
                            <span className="font-medium">Kelola Game</span>
                        </Link>
                    )}

                    {/* Manage Users - Admin only */}
                    {isAdmin && (
                        <Link
                            href="/dashboard/admin/users"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/admin/users")
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium">Kelola User</span>
                        </Link>
                    )}

                    {/* Settings Link - for all users */}
                    <Link
                        href="/dashboard/settings"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive("/dashboard/settings")
                            ? "bg-blue-600/20 text-blue-400"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Pengaturan</span>
                    </Link>
                </nav>

                {/* User Profile & Sign Out */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3 mb-4 px-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.name}
                            </p>
                            <p className="text-xs text-slate-400">
                                {user ? getRoleLabel(user.role) : ""}
                            </p>
                        </div>
                    </div>
                    <form action="/api/auth/signout" method="post" className="px-4">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Keluar</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 overflow-auto">
                {children}
            </main>
        </div>
    );
}
