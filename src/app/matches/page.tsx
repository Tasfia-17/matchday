"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { MatchCard } from "@/components/sports/MatchCard";
import { PredictionForm } from "@/components/sports/PredictionForm";
import { PredictionLeaderboard } from "@/components/sports/PredictionLeaderboard";
import { AIAnalyst } from "@/components/sports/AIAnalyst";
import { useRouter } from "next/navigation";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";
  scheduledAt: string;
  league: string | null;
  sport: string;
  venue: string | null;
  thumbnailUrl: string | null;
}

interface UserPrediction {
  predictedHome: number;
  predictedAway: number;
}

const SPORTS = [
  { label: "⚽ Football",   value: "football",   league: "4328" },
  { label: "🏀 Basketball", value: "basketball", league: "4387" },
  { label: "🏏 Cricket",    value: "cricket",    league: "4508" },
  { label: "🏎️ F1",        value: "f1",         league: "4370" },
];

export default function MatchesPage() {
  const router = useRouter();
  const [activeSport, setActiveSport] = useState(SPORTS[0]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Record<string, UserPrediction>>({});
  const [predictingMatch, setPredictingMatch] = useState<Match | null>(null);
  const [tab, setTab] = useState<"schedule" | "leaderboard">("schedule");

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/matches/upcoming?sport=${activeSport.value}&league=${activeSport.league}`
      );
      const data = await res.json();
      setMatches(data.matches ?? []);

      // Fetch user predictions for these matches
      const ids = (data.matches ?? []).map((m: Match) => m.id).join(",");
      if (ids) {
        const predRes = await fetch(`/api/predictions`);
        const predData = await predRes.json();
        const map: Record<string, UserPrediction> = {};
        for (const p of predData.predictions ?? []) {
          map[p.matchEventId] = {
            predictedHome: p.predictedHome,
            predictedAway: p.predictedAway,
          };
        }
        setPredictions(map);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeSport]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  function handleWatch(matchId: string) {
    router.push(`/room/match-${matchId}`);
  }

  return (
    <main className="min-h-screen bg-stadium-950 text-white">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-pitch-900/40 to-stadium-950 border-b border-stadium-800">
        <div className="absolute inset-0 bg-pitch-stripes opacity-20 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-mono font-bold text-white mb-3 tracking-tight"
          >
            MatchDay
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-pitch-300 text-lg"
          >
            Watch together · Predict scores · Earn Fan XP · Dominate the leaderboard
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Sport tabs */}
        <div className="flex gap-2 flex-wrap">
          {SPORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setActiveSport(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeSport.value === s.value
                  ? "bg-pitch-600 text-white shadow-lg"
                  : "bg-stadium-800 text-stadium-400 hover:text-white hover:bg-stadium-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content tabs */}
        <div className="flex gap-1 border-b border-stadium-800">
          {(["schedule", "leaderboard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-pitch-500 text-pitch-400"
                  : "border-transparent text-stadium-500 hover:text-white"
              }`}
            >
              {t === "schedule" ? "📅 Schedule" : "🏆 Prediction Leaderboard"}
            </button>
          ))}
        </div>

        {tab === "schedule" && (
          <>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 bg-stadium-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-16 text-stadium-500">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold">No upcoming matches found</p>
                <p className="text-sm mt-1">Try a different sport or check back later</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    {...match}
                    userPrediction={predictions[match.id] ?? null}
                    onPredict={() => setPredictingMatch(match)}
                    onWatch={handleWatch}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "leaderboard" && <PredictionLeaderboard />}
      </div>

      {/* Prediction modal */}
      {predictingMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPredictingMatch(null);
          }}
        >
          <PredictionForm
            matchId={predictingMatch.id}
            homeTeam={predictingMatch.homeTeam}
            awayTeam={predictingMatch.awayTeam}
            existing={predictions[predictingMatch.id] ?? null}
            onSuccess={(pred) => {
              setPredictions((p) => ({ ...p, [predictingMatch.id]: pred }));
            }}
            onClose={() => setPredictingMatch(null)}
          />
        </div>
      )}

      {/* AI Analyst floating widget */}
      <AIAnalyst sport={activeSport.value} />
    </main>
  );
}
