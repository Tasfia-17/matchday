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

  // Upsert each event into DB for caching
  for (const e of events.slice(0, 20)) {
    if (!e.idEvent) continue;
    const data = {
      sport: e.strSport.toLowerCase(),
      league: e.strLeague ?? null,
      homeTeam: e.strHomeTeam,
      awayTeam: e.strAwayTeam,
      status: normaliseStatus(e.strStatus),
      scheduledAt: new Date(`${e.dateEvent}T${e.strTime ?? '00:00:00'}`),
      venue: e.strVenue ?? null,
      season: e.strSeason ?? null,
      thumbnailUrl: e.strThumb ?? null,
      streamUrl: e.strVideo ?? null,
    };
    await prisma.matchEvent.upsert({
      where: { externalId: e.idEvent },
      create: { externalId: e.idEvent, ...data },
      update: { status: data.status },
    });
  }

  const saved = await prisma.matchEvent.findMany({
    where: {
      sport,
      status: { in: ['SCHEDULED', 'LIVE'] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 20,
  });

  return NextResponse.json({ matches: saved, source: 'api' });
}
