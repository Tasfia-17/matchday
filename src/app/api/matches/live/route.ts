import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unstable_noStore } from 'next/cache';

export const dynamic = 'force-dynamic';


export async function GET() {
  unstable_noStore();
  const liveMatches = await prisma.matchEvent.findMany({
    where: { status: 'LIVE' },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json({ matches: liveMatches });
}
