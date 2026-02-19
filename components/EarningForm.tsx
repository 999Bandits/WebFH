"use client";

import { useState } from "react";
import type { User, Game } from "@/types/database";
import { calculateNetIncome } from "@/lib/calculations";

const fmtNum = (n: number) => n.toLocaleString("id-ID");

interface EarningFormProps {
  users: User[];
  games: Game[];
}

export default function EarningForm({ users, games }: EarningFormProps) {
  const [userId, setUserId] = useState("");
  const [gameId, setGameId] = useState("");
  const [amountFarmed, setAmountFarmed] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewNetIncome, setPreviewNetIncome] = useState<number | null>(null);

  const selectedGame = games.find((g) => g.id === gameId);

  const formatNumber = (value: string): string => {
    if (!value) return "";
    const num = parseFloat(value.replace(/\./g, "").replace(/,/g, "."));
    if (isNaN(num)) return value;
    return num.toLocaleString("id-ID");
  };

  const handleAmountChange = (value: string) => {
    const rawValue = value.replace(/\./g, "").replace(/,/g, ".");

    setAmountFarmed(rawValue);
    setDisplayAmount(formatNumber(rawValue));
    setError(null);
    setSuccess(null);

    const amount = parseFloat(rawValue);
    if (selectedGame && !isNaN(amount) && amount > 0) {
      try {
        const netIncome = calculateNetIncome(amount, selectedGame.current_rate, selectedGame.rate_unit);
        setPreviewNetIncome(netIncome);
      } catch {
        setPreviewNetIncome(null);
      }
    } else {
      setPreviewNetIncome(null);
    }
  };

  const handleGameChange = (gameId: string) => {
    setGameId(gameId);
    setError(null);
    setSuccess(null);

    const game = games.find((g) => g.id === gameId);
    const amount = parseFloat(amountFarmed);
    if (game && !isNaN(amount) && amount > 0) {
      try {
        const netIncome = calculateNetIncome(amount, game.current_rate, game.rate_unit);
        setPreviewNetIncome(netIncome);
      } catch {
        setPreviewNetIncome(null);
      }
    } else {
      setPreviewNetIncome(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!userId) {
        throw new Error("Silakan pilih karyawan");
      }
      if (!gameId) {
        throw new Error("Silakan pilih game");
      }
      if (!amountFarmed || parseFloat(amountFarmed) <= 0) {
        throw new Error("Silakan masukkan jumlah yang valid");
      }

      const game = games.find((g) => g.id === gameId);
      if (!game) {
        throw new Error("Game yang dipilih tidak ditemukan");
      }

      const amount = parseFloat(amountFarmed);
      const rate = game.current_rate;
      const rateUnit = game.rate_unit;

      const netIncome = calculateNetIncome(amount, rate, rateUnit);

      const payload = {
        user_id: userId,
        game_id: gameId,
        amount_farmed: amount,
        applied_rate: rate,
        net_income: netIncome,
      };

      const response = await fetch("/api/earnings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal membuat catatan setoran");
      }

      setSuccess(
        `Catatan pendapatan berhasil dibuat! Pendapatan Bersih: Rp${fmtNum(netIncome)}`
      );

      setUserId("");
      setGameId("");
      setAmountFarmed("");
      setDisplayAmount("");
      setPreviewNetIncome(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ([8, 46, 9, 27, 13].includes(e.keyCode)) return;
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) return;
    if (e.keyCode >= 35 && e.keyCode <= 39) return;
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) return;
    if (e.key === "," || e.key === ".") return;

    e.preventDefault();
  };

  return (
    <div className="bg-slate-900 rounded-xl shadow-xl p-6 border border-slate-800">
      <h2 className="text-xl font-semibold text-white mb-6">
        Tambah Catatan Setoran
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-emerald-200">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="user"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Karyawan <span className="text-red-400">*</span>
          </label>
          <select
            id="user"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
          >
            <option value="">Pilih karyawan</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="game"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Game <span className="text-red-400">*</span>
          </label>
          <select
            id="game"
            value={gameId}
            onChange={(e) => handleGameChange(e.target.value)}
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
          >
            <option value="">Pilih game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name} (Rp{fmtNum(game.current_rate)}/{fmtNum(game.rate_unit)} {game.currency_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Jumlah yang Difarm <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="amount"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Contoh: 5.000.000"
              className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isLoading}
              inputMode="numeric"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-500 text-sm">unit</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Masukkan total jumlah yang difarm dalam unit mata uang game
          </p>
        </div>

        {previewNetIncome !== null && selectedGame && (
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800">
            <h3 className="text-sm font-medium text-white mb-2">
              Pratinjau Perhitungan
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Jumlah Difarm:</span>
                <span className="font-medium text-white">{fmtNum(parseFloat(amountFarmed))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate:</span>
                <span className="font-medium text-white">Rp{fmtNum(selectedGame.current_rate)} / {fmtNum(selectedGame.rate_unit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pendapatan Kotor:</span>
                <span className="font-medium text-white">
                  Rp{fmtNum((parseFloat(amountFarmed) / selectedGame.rate_unit) * selectedGame.current_rate)}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-800 pt-1 mt-1">
                <span className="text-white font-medium">Pendapatan Bersih (50%):</span>
                <span className="text-emerald-400 font-bold text-lg">
                  Rp{fmtNum(previewNetIncome)}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Membuat Catatan...
            </>
          ) : (
            "Buat Catatan Setoran"
          )}
        </button>
      </form>
    </div>
  );
}
