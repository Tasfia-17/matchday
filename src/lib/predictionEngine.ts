/**
 * Prediction scoring engine.
 *
 * XP table:
 *   Exact scoreline  → 100 XP
 *   Correct result   → 40 XP   (right winner or correct draw)
 *   Wrong            → 0 XP
 *
 * Called server-side when a MatchEvent transitions to FINISHED.
 */

import { prisma } from './prisma';

export interface PredictionScore {
  isExact: boolean;
  isCorrectResult: boolean;
  xpEarned: number;
}

export function scorePrediction(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): PredictionScore {
  const isExact = predictedHome === actualHome && predictedAway === actualAway;

  const predictedResult = Math.sign(predictedHome - predictedAway); // 1 | 0 | -1
  const actualResult = Math.sign(actualHome - actualAway);
  const isCorrectResult = predictedResult === actualResult;

  const xpEarned = isExact ? 100 : isCorrectResult ? 40 : 0;

  return { isExact, isCorrectResult, xpEarned };
}

/**
 * Score all pending predictions for a finished match and award XP.
 * Call this from a cron job or webhook after match status becomes FINISHED.
 */
export async function scoreMatchPredictions(
  matchEventId: string
): Promise<{ scored: number; totalXp: number }> {
  const match = await prisma.matchEvent.findUnique({
    where: { id: matchEventId },
  });

  if (!match || match.status !== 'FINISHED') {
    return { scored: 0, totalXp: 0 };
  }
  if (match.homeScore === null || match.awayScore === null) {
    return { scored: 0, totalXp: 0 };
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchEventId, isScored: false },
  });

  let scored = 0;
  let totalXp = 0;

  for (const pred of predictions) {
    const result = scorePrediction(
      pred.predictedHome,
      pred.predictedAway,
      match.homeScore,
      match.awayScore
    );

    await prisma.$transaction([
      prisma.prediction.update({
        where: { id: pred.id },
        data: {
          isScored: true,
          isExact: result.isExact,
          isCorrectResult: result.isCorrectResult,
          xpEarned: result.xpEarned,
        },
      }),
      // Award XP to user
      prisma.user.update({
        where: { id: pred.userId },
        data: {
          totalXP: { increment: result.xpEarned },
        },
      }),
    ]);

    scored++;
    totalXp += result.xpEarned;
  }

  return { scored, totalXp };
}

/** Leaderboard: top fans by prediction XP this week */
export async function getPredictionLeaderboard(
  limit = 20
): Promise<Array<{ userId: string; username: string; totalXp: number; exactCount: number }>> {
  const results = await prisma.prediction.groupBy({
    by: ['userId'],
    where: { isScored: true },
    _sum: { xpEarned: true },
    _count: { isExact: true },
    orderBy: { _sum: { xpEarned: 'desc' } },
    take: limit,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: results.map((r) => r.userId) } },
    select: { id: true, username: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.username]));

  return results.map((r) => ({
    userId: r.userId,
    username: userMap.get(r.userId) ?? 'Unknown',
    totalXp: r._sum.xpEarned ?? 0,
    exactCount: r._count.isExact ?? 0,
  }));
}
