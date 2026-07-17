"use client";

import React from "react";
import { motion } from "motion/react";

interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";
  scheduledAt: string | Date;
  league?: string | null;
  sport: string;
  venue?: string | null;
  thumbnailUrl?: string | null;
  onPredict?: (matchId: string) => void;
  onWatch?: (matchId: string) => void;
  userPrediction?: { predictedHome: number; predictedAway: number } | null;
}

const SPORT_EMOJI: Record<string, string> = {
  football:   "⚽",
  soccer:     "⚽",
  basketball: "🏀",
  cricket:    "🏏",
  tennis:     "🎾",
  "american football": "🏈",
  f1:         "🏎️",
  rugby:      "🏉",
  golf:       "⛳",
  hockey:     "🏒",
  baseball:   "⚾",
};

function SportEmoji({ sport }: { sport: string }) {
  const emoji = SPORT_EMOJI[sport.toLowerCase()] ?? "🏆";
  return <span role="img" aria-label={sport}>{emoji}</span>;
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold animate-live-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
      LIVE
    </span>
  );
}

function StatusBadge({ status }: { status: MatchCardProps["status"] }) {
  if (status === "LIVE") return <LiveBadge />;
  if (status === "FINISHED")
    return (
      <span className="px-2 py-0.5 rounded-full bg-stadium-700 text-stadium-300 text-xs font-semibold">
        FT
      </span>
    );
  if (status === "POSTPONED")
    return (
      <span className="px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400 text-xs font-semibold">
        PPD
      </span>
    );
  return null;
}

export function MatchCard({
  id,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  scheduledAt,
  league,
  sport,
  venue,
  thumbnailUrl,
  onPredict,
  onWatch,
  userPrediction,
}: MatchCardProps) {
  const kickoff = new Date(scheduledAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFinished = status === "FINISHED";
  const isLive = status === "LIVE";
  const canPredict = status === "SCHEDULED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-stadium-800 bg-stadium-900 shadow-lg"
    >
      {/* Pitch stripe background */}
      <div className="absolute inset-0 bg-pitch-stripes opacity-30 pointer-events-none" />

      {/* Live glow ring */}
      {isLive && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-red-500 ring-offset-1 ring-offset-stadium-950 animate-pulse pointer-events-none" />
      )}

      <div className="relative p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between text-xs text-stadium-400">
          <span className="flex items-center gap-1.5">
            <SportEmoji sport={sport} />
            <span className="font-medium text-stadium-300">{league ?? sport}</span>
          </span>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {canPredict && (
              <span className="text-stadium-500 text-xs">{kickoff}</span>
            )}
          </div>
        </div>

        {/* Score board */}
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <div className="flex-1 text-right">
            <p className="text-white font-bold text-base leading-tight truncate">
              {homeTeam}
            </p>
          </div>

          {/* Score / VS */}
          <div className="flex items-center justify-center gap-3 min-w-[80px]">
            {(isLive || isFinished) && homeScore !== null && awayScore !== null ? (
              <>
                <motion.span
                  key={`${homeScore}-home`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-mono font-bold text-pitch-400 leading-none"
                >
                  {homeScore}
                </motion.span>
                <span className="text-stadium-500 text-lg font-mono">—</span>
                <motion.span
                  key={`${awayScore}-away`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-mono font-bold text-pitch-400 leading-none"
                >
                  {awayScore}
                </motion.span>
              </>
            ) : (
              <span className="text-stadium-500 font-mono text-xl font-bold">VS</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-base leading-tight truncate">
              {awayTeam}
            </p>
          </div>
        </div>

        {/* User's prediction */}
        {userPrediction && (
          <div className="flex items-center justify-center gap-2 py-1 px-3 rounded-xl bg-pitch-900/60 border border-pitch-800/60 text-xs text-pitch-300">
            <span>Your prediction:</span>
            <span className="font-mono font-bold text-pitch-400">
              {userPrediction.predictedHome} – {userPrediction.predictedAway}
            </span>
          </div>
        )}

        {/* Venue */}
        {venue && (
          <p className="text-stadium-500 text-xs text-center truncate">📍 {venue}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {canPredict && onPredict && (
            <button
              onClick={() => onPredict(id)}
              className="flex-1 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-bold transition-colors"
            >
              {userPrediction ? "✏️ Edit Prediction" : "🎯 Predict Score"}
            </button>
          )}
          {onWatch && (
            <button
              onClick={() => onWatch(id)}
              className="flex-1 py-2 rounded-xl bg-stadium-700 hover:bg-stadium-600 text-white text-xs font-bold transition-colors"
            >
              📺 Watch Together
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
