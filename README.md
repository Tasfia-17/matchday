# MatchDay

**Real-time sports watch parties, score predictions, and Fan XP.**

MatchDay is a full-stack web application built for the Sports World Cup Hackathon (Track 2: Fan Experience and Engagement). Fans co-watch live matches together, predict scores before kick-off, earn XP for correct predictions, and compete on a global prediction leaderboard. The platform runs on a production-grade real-time engine (Socket.IO), a semantic highlight search layer (Qdrant + Gemini), and a full gamification system.

Live demo: Deploy to Vercel using the instructions below.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How the Prediction System Works](#how-the-prediction-system-works)
- [Sponsor Tool Integration](#sponsor-tool-integration)
- [Deployment to Vercel](#deployment-to-vercel)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Hackathon Track](#hackathon-track)

---

## Features

### Core Sports Features

- **Match Schedule** -- Browse upcoming and live matches across football, basketball, cricket, and F1, sourced from TheSportsDB API with a database cache layer.
- **Score Predictions** -- Submit a predicted scoreline before a match starts. Predictions are locked the moment the match goes live.
- **Prediction XP** -- Earn 5 XP for submitting, 40 XP for correct result, 100 XP for an exact scoreline.
- **Prediction Leaderboard** -- Global rankings by total prediction XP, showing exact-score streaks.
- **AI Sports Analyst** -- A Gemini-powered chat widget that answers sports questions and surfaces relevant highlight clips from Qdrant semantic search.
- **Fan Clubs** -- Team-aligned social groups with shared rooms and chat.

### Real-time Watch Rooms

- Synchronized playback for YouTube URLs and direct stream links.
- Shared match queue with fan voting on what to watch next.
- Live chat with emoji reactions, typing indicators, and match-event reactions (goal, red card, etc.).
- Public and private rooms with shareable invite links.
- Room presence, guest access, and connection status display.

### Gamification Layer

- XP, levels, daily quests, streaks, achievements, and reward crates.
- Global leaderboard across all activities.
- Unlockable titles, badges, and profile themes.
- Watch history and room rejoin links.

### Platform Features

- Progressive Web App (installable, offline fallback).
- Responsive layout for mobile and desktop.
- Admin panel with user moderation, broadcast messaging, and system controls.
- Rate limiting, security headers, and input validation throughout.
- English/Turkish i18n.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS (sports theme), Motion (animations) |
| Real-time | Express 5, Socket.IO 4 |
| Database | PostgreSQL 14+, Prisma 6 |
| Auth | NextAuth v4, bcrypt |
| Background jobs | BullMQ, Redis 7 |
| Sports data | TheSportsDB API (free), API-Football (optional) |
| AI analyst | Google Gemini 1.5 Flash |
| Highlight search | Qdrant vector DB + Gemini text-embedding-004 |
| Deployment | Vercel (Next.js), Railway or Render (Socket.IO server) |
| Dev infra | Docker Compose, Nginx, Prisma migrations |

---

## Architecture

```
matchday/
  server/
    handlers/
      roomHandler.ts        Match room lifecycle and queue management
      chatHandler.ts        Live chat with write-behind Redis cache
      videoHandler.ts       Video sync with soft-correction algorithm
      gameHandler.ts        Sports trivia and multiplayer mini-games
      presenceHandler.ts    User presence, DMs, and disconnect cleanup
    index.ts                Express + Socket.IO orchestrator (thin)
    state.ts                In-memory room state + Redis bridge
    middleware/auth.ts      Socket auth middleware

  src/
    app/
      matches/              Match schedule page (main landing)
      room/[roomId]/        Live watch room
      api/
        matches/upcoming/   Fetch upcoming events from TheSportsDB
        matches/live/       Currently live matches
        matches/[matchId]/  Match detail + admin score update
        predictions/        Submit and retrieve predictions
        predictions/leaderboard/  Fan XP rankings
        highlights/search/  Qdrant semantic highlight search
        ai-analyst/         Gemini sports analyst endpoint
        rooms/              Room CRUD
        user/               Profile, XP, quests, achievements
        auth/               NextAuth sign-in/register flows
        admin/              Admin panel API routes
        (+ 30 more routes)

    components/
      sports/
        MatchCard.tsx           Match tile with live score display
        PredictionForm.tsx      Score picker with +/- buttons
        PredictionLeaderboard.tsx   Fan XP rankings table
        AIAnalyst.tsx           Floating AI chat widget
      room/                 Watch room UI (player, chat, queue)
      engagement/           XP display, quests, leaderboard, streaks
      games/                Mini-games (trivia, penalty, etc.)
      admin/                Admin panel components
      (+ many more)

    lib/
      sportsApi.ts          TheSportsDB HTTP client
      predictionEngine.ts   XP scoring and leaderboard queries
      qdrantHighlights.ts   Qdrant upsert and semantic search
      auth.ts               NextAuth config
      prisma.ts             Prisma client singleton
      xp.ts                 XP/level calculations
      chatEngine.ts         Chat sanitization and rate limiting
      (+ more utilities)

  prisma/
    schema.prisma           28 models including MatchEvent, Prediction,
                            FanClub, FanClubMember, Highlight
    migrations/             10 migration files
    seed.ts                 Demo data for development

  public/                   Static assets, icons, PWA manifest
```

---

## How the Prediction System Works

### Submitting a prediction

1. User opens the Match Schedule page and finds an upcoming match (status: SCHEDULED).
2. They click "Predict Score" and use the +/- picker to set home and away goals.
3. On submit, `POST /api/predictions` validates the match is still SCHEDULED, saves the prediction, and awards 5 XP immediately.
4. Predictions are locked the moment a match transitions to LIVE or FINISHED.

### Scoring predictions

When a match finishes, an admin (or future webhook) calls `POST /api/matches/[matchId]` with `{ homeScore, awayScore, status: "FINISHED" }`.

This triggers `scoreMatchPredictions()` in `predictionEngine.ts`:

```
Exact scoreline  (e.g. predicted 2-1, actual 2-1)  ->  100 XP
Correct result   (right winner or correct draw)      ->   40 XP
Wrong result                                         ->    0 XP
```

XP is added to the user's `totalXP` in a database transaction alongside marking the prediction as scored.

### Leaderboard

`GET /api/predictions/leaderboard` aggregates scored predictions grouped by user, ordered by total XP earned through predictions. It also surfaces the count of exact scorelines per user.

---

## Sponsor Tool Integration

### Qdrant (highlight search)

File: `src/lib/qdrantHighlights.ts`

Highlights are indexed in a Qdrant collection called `matchday_highlights` using Gemini text-embedding-004 vectors (768 dimensions). When a fan asks the AI Analyst a question, the system:

1. Embeds the query using Gemini.
2. Runs a vector similarity search in Qdrant filtered by sport.
3. Injects matching highlight titles and URLs into the Gemini prompt as context.

To add a highlight to the index:

```ts
import { upsertHighlight } from '@/lib/qdrantHighlights';

await upsertHighlight({
  id: 'highlight-123',
  title: 'Haaland hat-trick vs Arsenal',
  sport: 'football',
  matchRef: 'Man City vs Arsenal 2026',
  videoUrl: 'https://youtube.com/watch?v=...',
  tags: ['goal', 'haaland', 'premier-league'],
});
```

### Google Gemini (AI analyst)

File: `src/app/api/ai-analyst/route.ts`

Model: `gemini-1.5-flash`. The system prompt positions the model as a sports analyst. Each request injects relevant Qdrant highlights as context before passing the user message.

### InsForge

The project is deployable via Docker Compose (`docker-compose.yml`) for agent-native cloud infrastructure. The `Dockerfile.nextjs` and `Dockerfile.server` files define the two service containers.

---

## Deployment to Vercel

### What runs on Vercel

The **Next.js app** (all pages, API routes, and static assets) deploys to Vercel. The **Socket.IO real-time server** must run separately on a long-lived service like Railway, Render, or a VPS because Vercel functions are stateless and do not support persistent WebSocket connections.

### Step 1 -- Deploy the Next.js app

1. Fork or push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and click "Add New Project".
3. Import the GitHub repo.
4. Vercel auto-detects Next.js. Leave all build settings as default.
5. Add the required environment variables (see table below) in the Vercel dashboard under Settings > Environment Variables.
6. Click Deploy.

### Step 2 -- Deploy the Socket.IO server

The real-time server lives in `server/`. Deploy it to Railway or Render:

**Railway (recommended):**

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

Set the same environment variables on Railway. Note the deployed URL (e.g. `https://matchday-server.railway.app`).

**Render:**

1. Create a new Web Service pointing to this repo.
2. Set Build Command: `npm install && npm run server:build`
3. Set Start Command: `node dist/server/index.js`
4. Add environment variables.

### Step 3 -- Connect the two services

In your Vercel project, set:

```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

This tells the Next.js client where to connect for real-time features.

### Step 4 -- Database and Redis

**Database (PostgreSQL):**
- Recommended: [Neon](https://neon.tech) (free tier, serverless Postgres).
- Alternative: [Supabase](https://supabase.com), [Railway Postgres](https://railway.app).
- Copy the connection string as `DATABASE_URL`.

**Redis:**
- Recommended: [Upstash Redis](https://upstash.com) (free tier, serverless).
- Alternative: Railway Redis add-on.
- Copy the connection string as `REDIS_URL`.

**Qdrant:**
- Recommended: [Qdrant Cloud](https://cloud.qdrant.io) (free tier, 1 GB).
- Copy the cluster URL as `QDRANT_URL` and the API key as `QDRANT_API_KEY`.

### Vercel Environment Variables Reference

Set all of these in the Vercel dashboard:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random 32-char secret (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | Yes | Your Vercel deployment URL (e.g. `https://matchday.vercel.app`) |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | URL of the deployed Socket.IO server |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `THESPORTSDB_API_KEY` | Yes | `1` for free tier, or paid key |
| `QDRANT_URL` | Yes | Qdrant cluster URL |
| `QDRANT_API_KEY` | No | Qdrant API key (required for cloud) |
| `REDIS_URL` | No | Redis connection string (enables rate limiting and BullMQ) |
| `RESEND_API_KEY` | No | For transactional email (password reset, verify) |
| `RESEND_FROM_EMAIL` | No | Sender address e.g. `MatchDay <noreply@yourdomain.com>` |

---

## Local Development

### Prerequisites

- Node.js 22.x
- PostgreSQL 14+
- Redis 7+ (optional, degrades gracefully)

### Setup

```bash
git clone https://github.com/Tasfia-17/matchday.git
cd matchday
npm install
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```
DATABASE_URL="postgresql://user:password@localhost:5432/matchday"
NEXTAUTH_SECRET="any-random-string-for-local"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
GEMINI_API_KEY="your-gemini-key"
THESPORTSDB_API_KEY="1"
QDRANT_URL="http://localhost:6333"
```

### Run migrations and seed

```bash
npx prisma migrate deploy
npm run db:seed
```

### Start development servers

Terminal 1 (Next.js):

```bash
npm run dev
```

Terminal 2 (Socket.IO):

```bash
npm run server
```

Open `http://localhost:3000`. You will land on the match schedule.

### Seed credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@matchday.gg | admin123 |
| Fan | fan@matchday.gg | fan123 |

### Docker Compose (full stack)

```bash
docker compose up
```

This starts Postgres, Redis, the Next.js app, and the Socket.IO server together.

---

## Environment Variables

Full reference including optional variables:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-app.vercel.app"

# Real-time server
NEXT_PUBLIC_SOCKET_URL="https://your-socket-server.railway.app"

# Sports data
THESPORTSDB_API_KEY="1"

# AI and search
GEMINI_API_KEY="..."
QDRANT_URL="https://your-cluster.qdrant.io"
QDRANT_API_KEY="..."

# Optional
REDIS_URL="redis://..."
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="MatchDay <noreply@yourdomain.com>"
LOG_LEVEL="debug"
SKIP_EMAIL_VERIFICATION="true"
```

---

## API Reference

### Match endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/matches/upcoming` | Upcoming matches (query: `sport`, `league`) |
| GET | `/api/matches/live` | Currently live matches |
| GET | `/api/matches/[matchId]` | Match detail with user prediction |
| POST | `/api/matches/[matchId]` | Admin: update score and trigger XP scoring |

### Prediction endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/predictions` | Submit or update a prediction |
| GET | `/api/predictions` | User's predictions (query: `matchEventId`) |
| GET | `/api/predictions/leaderboard` | Fan XP leaderboard (query: `limit`) |

### AI and highlights

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai-analyst` | Ask the sports analyst (body: `{ message, sport }`) |
| GET | `/api/highlights/search` | Semantic search (query: `q`, `sport`, `limit`) |

### Room endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/rooms` | List public rooms |
| POST | `/api/rooms` | Create a room |
| GET | `/api/rooms/[roomId]` | Room detail |

---

## Project Structure

```
matchday/
  .env.example              Environment variable template
  vercel.json               Vercel deployment config
  next.config.js            Next.js config (no standalone output for Vercel)
  tailwind.config.js        Sports color palette (pitch-green, stadium-dark)
  docker-compose.yml        Full-stack local development
  Dockerfile.nextjs         Next.js container (for Docker/InsForge)
  Dockerfile.server         Socket.IO server container
  prisma/
    schema.prisma           All 28 models
    seed.ts                 Demo data
    migrations/             10 SQL migration files
  server/                   Socket.IO real-time server
  src/
    app/                    Next.js App Router pages and API routes
    components/             All UI components
      sports/               MatchCard, PredictionForm, Leaderboard, AIAnalyst
    lib/                    Shared utilities and service clients
      sportsApi.ts          TheSportsDB client
      predictionEngine.ts   Prediction XP scoring
      qdrantHighlights.ts   Vector search
  public/                   Static assets and PWA files
  tests/                    Unit and integration tests
```

---

## Hackathon Track

**Sports World Cup Hackathon**
Track 2: Fan Experience and Engagement
Build period: July 13-17, 2026

The core differentiator is the prediction-plus-XP loop. This is not a watch party with sports colors; the prediction mechanic is the reason fans open the app before kick-off, stay during the match, and return after to check their score. The AI Analyst and Qdrant highlight search give users value between matches. The full social and gamification layer (inherited from the CinePurr codebase and fully adapted for sports) creates long-term retention.

---

Built by Tasfia-17 for the Sports World Cup Hackathon 2026.
