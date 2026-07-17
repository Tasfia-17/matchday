"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface PredictionFormProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  existing?: { predictedHome: number; predictedAway: number } | null;
  onSuccess?: (prediction: { predictedHome: number; predictedAway: number }) => void;
  onClose?: () => void;
}

export function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  existing,
  onSuccess,
  onClose,
}: PredictionFormProps) {
  const [homeGoals, setHomeGoals] = useState(existing?.predictedHome ?? 0);
  const [awayGoals, setAwayGoals] = useState(existing?.predictedAway ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const adjust = (
    side: "home" | "away",
    delta: number
  ) => {
    if (side === "home")
      setHomeGoals((v) => Math.max(0, Math.min(20, v + delta)));
    else setAwayGoals((v) => Math.max(0, Math.min(20, v + delta)));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchEventId: matchId,
          predictedHome: homeGoals,
          predictedAway: awayGoals,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSubmitted(true);
      onSuccess?.({ predictedHome: homeGoals, predictedAway: awayGoals });
      setTimeout(() => onClose?.(), 1200);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-stadium-900 border border-stadium-700 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl"
      >
        <h2 className="text-white font-bold text-lg text-center mb-1">
          🎯 Predict the Score
        </h2>
        <p className="text-stadium-400 text-xs text-center mb-6">
          +5 XP for predicting · +40 XP correct result · +100 XP exact score
        </p>

        {submitted ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6 text-pitch-400 text-4xl"
          >
            ✅
            <p className="text-white text-sm mt-2 font-semibold">Prediction locked in!</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Score picker */}
            <div className="flex items-center justify-center gap-4">
              {/* Home */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-white font-semibold text-sm text-center leading-tight">
                  {homeTeam}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjust("home", -1)}
                    className="w-8 h-8 rounded-full bg-stadium-700 hover:bg-stadium-600 text-white font-bold text-lg transition-colors"
                  >
                    −
                  </button>
                  <span className="text-4xl font-mono font-bold text-pitch-400 w-10 text-center">
                    {homeGoals}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjust("home", 1)}
                    className="w-8 h-8 rounded-full bg-stadium-700 hover:bg-stadium-600 text-white font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <span className="text-stadium-500 font-mono text-2xl font-bold">—</span>

              {/* Away */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-white font-semibold text-sm text-center leading-tight">
                  {awayTeam}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjust("away", -1)}
                    className="w-8 h-8 rounded-full bg-stadium-700 hover:bg-stadium-600 text-white font-bold text-lg transition-colors"
                  >
                    −
                  </button>
                  <span className="text-4xl font-mono font-bold text-pitch-400 w-10 text-center">
                    {awayGoals}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjust("away", 1)}
                    className="w-8 h-8 rounded-full bg-stadium-700 hover:bg-stadium-600 text-white font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <div className="flex gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-stadium-700 hover:bg-stadium-600 text-white text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {loading ? "Saving…" : existing ? "Update Prediction" : "Lock It In 🔒"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
