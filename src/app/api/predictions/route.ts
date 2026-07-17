import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/predictions
 * Body: { matchEventId, predictedHome, predictedAway }
 *
 * Creates or updates a prediction. Predictions are locked once the match
 * status is no longer SCHEDULED (i.e., LIVE or FINISHED).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { matchEventId, predictedHome, predictedAway } = body;

  if (
    typeof matchEventId !== 'string' ||
    typeof predictedHome !== 'number' ||
    typeof predictedAway !== 'number'
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (predictedHome < 0 || predictedAway < 0 || predictedHome > 20 || predictedAway > 20) {
    return NextResponse.json({ error: 'Score out of range' }, { status: 400 });
  }

  const match = await prisma.matchEvent.findUnique({ where: { id: matchEventId } });
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.status !== 'SCHEDULED') {
    return NextResponse.json(
      { error: 'Predictions are locked — match has already started or finished' },
      { status: 409 }
    );
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchEventId: { userId, matchEventId } },
    create: { userId, matchEventId, predictedHome, predictedAway },
    update: { predictedHome, predictedAway },
  });

  // Award 5 XP just for submitting a prediction
  await prisma.user.update({
    where: { id: userId },
    data: { totalXP: { increment: 5 } },
  });

  return NextResponse.json({ prediction });
}

/** GET /api/predictions?matchEventId=xxx — user's predictions */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const matchEventId = searchParams.get('matchEventId');
  const userId = (session.user as any).id as string;

  const where: Record<string, any> = { userId };
  if (matchEventId) where.matchEventId = matchEventId;

  const predictions = await prisma.prediction.findMany({
    where,
    include: { matchEvent: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ predictions });
}
