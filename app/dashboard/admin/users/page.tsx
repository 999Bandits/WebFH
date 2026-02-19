"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { deleteUser } from "@/app/actions/deleteUser";

function DeleteButton({ userId, onDeleted }: { userId: string; onDeleted: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      await deleteUser(formData);
      onDeleted();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
    >
      {isDeleting ? "..." : "Hapus"}
    </button>
  );
}

function RoleSelect({ userId, currentRole, onUpdated }: { userId: string; currentRole: string; onUpdated: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newRole: string) => {
    setIsUpdating(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      onUpdated();
    }
    setIsUpdating(false);
  };

  return (
    <div className="flex gap-2">
      <select
        defaultValue={currentRole}
        onChange={(e) => handleUpdate(e.target.value)}
        disabled={isUpdating}
        className="px-2 py-1 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
      >
        <option value="employee">Karyawan</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}

function PendingUserCard({ user, onAction }: { user: { id: string; name: string }; onAction: () => void }) {
  const [selectedRole, setSelectedRole] = useState("employee");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("users")
      .update({ role: selectedRole })
      .eq("id", user.id);

    if (!error) {
      onAction();
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col p-4 bg-slate-950 rounded-lg border border-slate-800">
      <div className="flex-1 mb-4">
        <p className="font-medium text-white">{user.name}</p>
        <p className="text-sm text-slate-500">UID: {user.id.substring(0, 8)}...</p>
      </div>
      <div className="flex gap-2 mb-2">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="employee">Karyawan</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {isProcessing ? "..." : "Setuju"}
        </button>
      </div>
      <DeleteButton userId={user.id} onDeleted={onAction} />
    </div>
  );
}

export default function ManageUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        redirect("/login");
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (user?.role !== "admin") {
        redirect("/dashboard");
        return;
      }

      setIsAdmin(true);
      fetchUsers();
    }

    checkAuth();
  }, []);

  async function fetchUsers() {
    const supabase = createClient();

    const { data: pending } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("role", "pending")
      .order("name");

    const { data: active } = await supabase
      .from("users")
      .select("id, name, role")
      .in("role", ["employee", "admin"])
      .order("name");

    setPendingUsers(pending || []);
    setActiveUsers(active || []);
    setLoading(false);
  }

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      admin: "Admin",
      employee: "Karyawan",
      pending: "Menunggu",
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === "admin") return "bg-purple-900/30 text-purple-400 border-purple-700";
    if (role === "employee") return "bg-emerald-900/30 text-emerald-400 border-emerald-700";
    return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Kelola User</h1>

        {/* Section A: Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="mb-8 bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
              Persetujuan User ({pendingUsers.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingUsers.map((user) => (
                <PendingUserCard key={user.id} user={user} onAction={fetchUsers} />
              ))}
            </div>
          </div>
        )}

        {/* Section B: Active Users */}
        <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            User Aktif ({activeUsers.length})
          </h2>
          {activeUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 uppercase">Nama</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 uppercase">UID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-white">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{user.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <RoleSelect userId={user.id} currentRole={user.role} onUpdated={fetchUsers} />
                          <DeleteButton userId={user.id} onDeleted={fetchUsers} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">Belum ada user aktif.</p>
          )}
        </div>
      </main>
    </div>
  );
}
