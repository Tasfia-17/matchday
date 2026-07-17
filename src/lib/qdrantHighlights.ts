/**
 * Qdrant vector search for sports highlights.
 * Used by the AI analyst to surface relevant clips when answering fan queries.
 *
 * Collection schema:
 *   - vector: 768-dim embedding from Gemini text-embedding-004
 *   - payload: { title, sport, matchRef, videoUrl, thumbnailUrl, tags }
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';

const COLLECTION = 'matchday_highlights';
const VECTOR_SIZE = 768;

let _client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!_client) {
    _client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY || undefined,
    });
  }
  return _client;
}

/** Embed text using Gemini text-embedding-004 */
async function embed(text: string): Promise<number[]> {
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genai.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/** Ensure the highlights collection exists */
export async function ensureCollection(): Promise<void> {
  const client = getClient();
  try {
    const { exists } = await client.collectionExists(COLLECTION);
    if (!exists) {
      await client.createCollection(COLLECTION, {
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
      });
    }
  } catch (err) {
    console.warn('[qdrant] ensureCollection failed:', err);
  }
}

export interface HighlightPayload {
  id: string;
  title: string;
  sport: string;
  matchRef?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags: string[];
}

/** Upsert a highlight into Qdrant */
export async function upsertHighlight(payload: HighlightPayload): Promise<void> {
  const client = getClient();
  const vector = await embed(
    `${payload.title} ${payload.sport} ${payload.matchRef ?? ''} ${payload.tags.join(' ')}`
  );
  await client.upsert(COLLECTION, {
    wait: true,
    points: [{ id: payload.id, vector, payload }],
  });
}

/** Search for highlights semantically close to a query */
export async function searchHighlights(
  query: string,
  limit = 5,
  sportFilter?: string
): Promise<HighlightPayload[]> {
  const client = getClient();
  try {
    const vector = await embed(query);
    const filter = sportFilter
      ? {
          must: [
            { key: 'sport', match: { value: sportFilter } },
          ],
        }
      : undefined;

    const results = await client.search(COLLECTION, {
      vector,
      limit,
      filter,
      with_payload: true,
    });

    return results
      .map((r) => r.payload as HighlightPayload)
      .filter(Boolean);
  } catch (err) {
    console.warn('[qdrant] searchHighlights failed:', err);
    return [];
  }
}
