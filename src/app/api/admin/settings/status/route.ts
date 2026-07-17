import { NextResponse } from 'next/server';
import { isMaintenanceMode } from '@/lib/maintenance';
import { unstable_noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  unstable_noStore();
  try {
    const maintenanceMode = await isMaintenanceMode();
    return NextResponse.json({ maintenanceMode });
  } catch (error) {
    return NextResponse.json({ maintenanceMode: false });
  }
}
