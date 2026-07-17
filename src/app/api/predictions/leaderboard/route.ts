import { NextResponse } from 'next/server';
import { getPredictionLeaderboard } from '@/lib/predictionEngine';
import { unstable_noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export const revalidate = 120;

export async function GET(req: Request) {
  unstable_noStore();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const leaderboard = await getPredictionLeaderboard(limit);
  return NextResponse.json({ leaderboard });
}
