import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchHighlights } from '@/lib/qdrantHighlights';
import { unstable_noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are MatchDay AI — a passionate, knowledgeable sports analyst assistant.
You help fans:
- Analyze upcoming and recent match predictions
- Explain team form, tactics, and player stats
- Suggest which matches to watch
- Answer sports trivia
- Recommend relevant highlights

Keep answers concise (2-4 sentences for simple questions, up to a paragraph for analysis).
Use sports emojis sparingly to add energy ⚽🏀🏏🎾🏎️.
Never make up specific statistics — say "I don't have that data" when unsure.`;

export async function POST(req: Request) {
  unstable_noStore();
  const body = await req.json();
  const { message, sport } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  // Enrich context with relevant highlights from Qdrant
  let highlightContext = '';
  try {
    const highlights = await searchHighlights(message, 3, sport ?? undefined);
    if (highlights.length > 0) {
      highlightContext =
        '\n\nRelevant highlights available:\n' +
        highlights.map((h) => `- ${h.title} (${h.sport}): ${h.videoUrl}`).join('\n');
    }
  } catch {
    // Non-fatal — proceed without highlight context
  }

  const prompt = message + highlightContext;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error('[ai-analyst] Gemini error:', err?.message);
    return NextResponse.json(
      { error: 'AI analyst unavailable' },
      { status: 503 }
    );
  }
}
