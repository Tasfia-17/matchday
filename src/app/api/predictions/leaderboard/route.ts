import { NextResponse } from 'next/server';
import { getPredictionLeaderboard } from '@/lib/predictionEngine';

export const revalidate = 120;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const leaderboard = await getPredictionLeaderboard(limit);
  return NextResponse.json({ leaderboard });
}
