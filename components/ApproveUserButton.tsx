"use client";

import { approveUser } from "@/app/actions/approveUser";

interface ApproveUserButtonProps {
  userId: string;
  userName: string;
}

export default function ApproveUserButton({ userId, userName }: ApproveUserButtonProps) {
  return (
    <form action={approveUser}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="px-4 py-2 bg-calm-sage-green text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
      >
        Setujui Pengguna
      </button>
    </form>
  );
}
