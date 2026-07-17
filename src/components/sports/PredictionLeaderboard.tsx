"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalXp: number;
  exactCount: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function PredictionLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions/leaderboard?limit=20")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.leaderboard ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-stadium-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-stadium-500 text-sm text-center py-8">
        No predictions scored yet. Be the first! 🎯
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry, idx) => (
        <motion.div
          key={entry.userId}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.04 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stadium-800/60 hover:bg-stadium-800 transition-colors"
        >
          {/* Rank */}
          <span className="w-7 text-center text-base">
            {idx < 3 ? MEDALS[idx] : <span className="text-stadium-500 font-mono text-sm">{idx + 1}</span>}
          </span>

          {/* Username */}
          <span className="flex-1 text-white font-semibold text-sm truncate">
            {entry.username}
          </span>

          {/* Exact badge */}
          {entry.exactCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-pitch-900/60 border border-pitch-700/40 text-pitch-400 text-xs font-mono">
              🎯 ×{entry.exactCount}
            </span>
          )}

          {/* XP */}
          <span className="text-gold-400 font-mono font-bold text-sm">
            {entry.totalXp.toLocaleString()} XP
          </span>
        </motion.div>
      ))}
    </div>
  );
}
