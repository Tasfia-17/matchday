import { NextResponse } from 'next/server';
import { searchHighlights } from '@/lib/qdrantHighlights';

/**
 * GET /api/highlights/search?q=Haaland+goal&sport=football&limit=5
 * Semantic search over highlight clips using Qdrant + Gemini embeddings.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const sport = searchParams.get('sport') ?? undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 20);

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  const highlights = await searchHighlights(q, limit, sport);
  return NextResponse.json({ highlights });
}
