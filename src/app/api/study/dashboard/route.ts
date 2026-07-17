import { NextResponse } from 'next/server';

import { getStudyDashboard } from '@/lib/studyData';
import { getStudySessionUserId, unauthorizedStudyResponse } from '@/lib/studyRouteUtils';
import logger from '@/lib/logger';
import { unstable_noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  unstable_noStore();
  try {
    const userId = await getStudySessionUserId();
    if (!userId) {
      return unauthorizedStudyResponse();
    }

    const dashboard = await getStudyDashboard(userId);
    return NextResponse.json(dashboard);
  } catch (error) {
    logger.error('Error fetching study dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch study dashboard' }, { status: 500 });
  }
}
