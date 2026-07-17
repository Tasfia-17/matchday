/**
 * TheSportsDB API client
 * Free key "1" works for all dev/hackathon usage.
 * Docs: https://www.thesportsdb.com/api.php
 */

import axios from 'axios';

const BASE = 'https://www.thesportsdb.com/api/v1/json';
const KEY = process.env.THESPORTSDB_API_KEY || '1';
const client = axios.create({ baseURL: `${BASE}/${KEY}`, timeout: 8000 });

export interface SportsEvent {
  idEvent: string;
  strEvent: string;
  strSport: string;
  strLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  dateEvent: string;
  strTime: string;
  strVenue: string | null;
  strSeason: string | null;
  strRound: string | null;
  strThumb: string | null;
  strVideo: string | null;
}

export interface SportsTeam {
  idTeam: string;
  strTeam: string;
  strSport: string;
  strLeague: string;
  strBadge: string | null;
  strDescriptionEN: string | null;
}

/** Get upcoming events for a league by league ID */
export async function getUpcomingEvents(leagueId: string): Promise<SportsEvent[]> {
  try {
    const { data } = await client.get(`/eventsnextleague.php?id=${leagueId}`);
    return data?.events ?? [];
  } catch {
    return [];
  }
}

/** Get events for a league on a specific date (YYYY-MM-DD) */
export async function getEventsByDate(
  leagueId: string,
  date: string
): Promise<SportsEvent[]> {
  try {
    const { data } = await client.get(`/eventsday.php?d=${date}&l=${leagueId}`);
    return data?.events ?? [];
  } catch {
    return [];
  }
}

/** Search for events by team name */
export async function searchEventsByTeam(teamName: string): Promise<SportsEvent[]> {
  try {
    const { data } = await client.get(
      `/searchevents.php?e=${encodeURIComponent(teamName)}`
    );
    return data?.event ?? [];
  } catch {
    return [];
  }
}

/** Get event detail by external ID */
export async function getEventById(eventId: string): Promise<SportsEvent | null> {
  try {
    const { data } = await client.get(`/lookupevent.php?id=${eventId}`);
    return data?.events?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Search teams */
export async function searchTeams(name: string): Promise<SportsTeam[]> {
  try {
    const { data } = await client.get(
      `/searchteams.php?t=${encodeURIComponent(name)}`
    );
    return data?.teams ?? [];
  } catch {
    return [];
  }
}

/** Well-known league IDs for convenience */
export const LEAGUES = {
  EPL: '4328',           // English Premier League
  LA_LIGA: '4335',       // La Liga
  CHAMPIONS_LEAGUE: '4480',
  NBA: '4387',
  NFL: '4391',
  IPL: '4508',           // Cricket IPL
  F1: '4370',
  UFC: '4443',
} as const;

/** Map TheSportsDB status strings to our internal status */
export function normaliseStatus(
  status: string
): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' {
  const s = status?.toLowerCase() ?? '';
  if (s.includes('in progress') || s === 'live') return 'LIVE';
  if (s === 'match finished' || s === 'ft' || s === 'aet' || s === 'pen')
    return 'FINISHED';
  if (s.includes('postponed') || s.includes('cancelled')) return 'POSTPONED';
  return 'SCHEDULED';
}
