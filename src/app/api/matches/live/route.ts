import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // refresh every 60s

export async function GET() {
  const liveMatches = await prisma.matchEvent.findMany({
    where: { status: 'LIVE' },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json({ matches: liveMatches });
}
