import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scoreMatchPredictions } from '@/lib/predictionEngine';

/** GET /api/matches/[matchId] — match detail with user's prediction */
export async function GET(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);

  const match = await prisma.matchEvent.findUnique({
    where: { id: params.matchId },
  });

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  let userPrediction = null;
  if (session?.user) {
    userPrediction = await prisma.prediction.findUnique({
      where: {
        userId_matchEventId: {
          userId: (session.user as any).id,
          matchEventId: params.matchId,
        },
      },
    });
  }

  // Prediction stats
  const stats = await prisma.prediction.groupBy({
    by: [],
    where: { matchEventId: params.matchId },
    _count: { id: true },
  });

  return NextResponse.json({
    match,
    userPrediction,
    totalPredictions: stats[0]?._count.id ?? 0,
  });
}

/** POST /api/matches/[matchId] — admin: update result and trigger scoring */
export async function POST(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { homeScore, awayScore, status } = body;

  const updated = await prisma.matchEvent.update({
    where: { id: params.matchId },
    data: {
      homeScore: homeScore ?? undefined,
      awayScore: awayScore ?? undefined,
      status: status ?? undefined,
    },
  });

  let scored = null;
  if (updated.status === 'FINISHED') {
    scored = await scoreMatchPredictions(params.matchId);
  }

  return NextResponse.json({ match: updated, scored });
}
