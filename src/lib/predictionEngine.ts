/**
 * Prediction scoring engine.
 *
 * XP table:
 *   Exact scoreline  -> 100 XP
 *   Correct result   -> 40 XP   (right winner or correct draw)
 *   Wrong            -> 0 XP
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
  const predictedResult = Math.sign(predictedHome - predictedAway);
  const actualResult = Math.sign(actualHome - actualAway);
  const isCorrectResult = predictedResult === actualResult;
  const xpEarned = isExact ? 100 : isCorrectResult ? 40 : 0;
  return { isExact, isCorrectResult, xpEarned };
}

/**
 * Score all pending predictions for a finished match and award XP.
 */
export async function scoreMatchPredictions(
  matchEventId: string
): Promise<{ scored: number; totalXp: number }> {
  const match = await prisma.matchEvent.findUnique({ where: { id: matchEventId } });

  if (!match || match.status !== 'FINISHED') return { scored: 0, totalXp: 0 };
  if (match.homeScore === null || match.awayScore === null) return { scored: 0, totalXp: 0 };

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
      prisma.user.update({
        where: { id: pred.userId },
        data: { totalXP: { increment: result.xpEarned } },
      }),
    ]);

    scored++;
    totalXp += result.xpEarned;
  }

  return { scored, totalXp };
}

/** Leaderboard: top fans by total prediction XP */
export async function getPredictionLeaderboard(
  limit = 20
): Promise<Array<{ userId: string; username: string; totalXp: number; exactCount: number }>> {
  // Raw aggregation via groupBy
  const results = await prisma.prediction.groupBy({
    by: ['userId'],
    where: { isScored: true },
    _sum: { xpEarned: true },
    _count: { id: true },
    orderBy: { _sum: { xpEarned: 'desc' } },
    take: limit,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: results.map((r) => r.userId) } },
    select: { id: true, username: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.username]));

  // Count exact predictions per user separately (groupBy _count doesn't filter by bool)
  const exactCounts = await prisma.prediction.groupBy({
    by: ['userId'],
    where: { isScored: true, isExact: true },
    _count: { id: true },
  });
  const exactMap = new Map(exactCounts.map((e) => [e.userId, e._count.id]));

  return results.map((r) => ({
    userId: r.userId,
    username: userMap.get(r.userId) ?? 'Unknown',
    totalXp: r._sum.xpEarned ?? 0,
    exactCount: exactMap.get(r.userId) ?? 0,
  }));
}
