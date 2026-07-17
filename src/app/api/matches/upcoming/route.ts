import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUpcomingEvents, normaliseStatus, LEAGUES } from '@/lib/sportsApi';

export const revalidate = 300; // cache 5 min

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport') ?? 'football';
  const leagueId = searchParams.get('league') ?? LEAGUES.EPL;

  // Try DB cache first
  const cached = await prisma.matchEvent.findMany({
    where: {
      sport,
      status: { in: ['SCHEDULED', 'LIVE'] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 20,
  });

  if (cached.length > 0) {
    return NextResponse.json({ matches: cached, source: 'cache' });
  }

  // Fetch from TheSportsDB
  const events = await getUpcomingEvents(leagueId);

  const matches = events.slice(0, 20).map((e) => ({
    externalId: e.idEvent,
    sport: e.strSport.toLowerCase(),
    league: e.strLeague,
    homeTeam: e.strHomeTeam,
    awayTeam: e.strAwayTeam,
    status: normaliseStatus(e.strStatus),
    scheduledAt: new Date(`${e.dateEvent}T${e.strTime ?? '00:00:00'}`),
    venue: e.strVenue ?? null,
    season: e.strSeason ?? null,
    thumbnailUrl: e.strThumb ?? null,
    streamUrl: e.strVideo ?? null,
  }));

  // Upsert into DB for caching
  for (const m of matches) {
    if (!m.externalId) continue;
    await prisma.matchEvent.upsert({
      where: { externalId: m.externalId },
      create: m,
      update: { status: m.status, homeScore: null, awayScore: null },
    });
  }

  const saved = await prisma.matchEvent.findMany({
    where: {
      externalId: { in: matches.map((m) => m.externalId!).filter(Boolean) },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json({ matches: saved, source: 'api' });
}
