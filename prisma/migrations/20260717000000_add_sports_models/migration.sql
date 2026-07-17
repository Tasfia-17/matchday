-- MatchDay sports models migration
-- Adds: MatchEvent, Prediction, FanClub, FanClubMember, Highlight

CREATE TABLE "MatchEvent" (
    "id"           TEXT NOT NULL,
    "externalId"   TEXT,
    "sport"        TEXT NOT NULL,
    "league"       TEXT,
    "homeTeam"     TEXT NOT NULL,
    "awayTeam"     TEXT NOT NULL,
    "homeScore"    INTEGER,
    "awayScore"    INTEGER,
    "status"       TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt"  TIMESTAMP(3) NOT NULL,
    "venue"        TEXT,
    "season"       TEXT,
    "round"        TEXT,
    "streamUrl"    TEXT,
    "thumbnailUrl" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchEvent_externalId_key" ON "MatchEvent"("externalId");
CREATE INDEX "MatchEvent_sport_scheduledAt_idx" ON "MatchEvent"("sport", "scheduledAt");
CREATE INDEX "MatchEvent_status_idx" ON "MatchEvent"("status");
CREATE INDEX "MatchEvent_scheduledAt_idx" ON "MatchEvent"("scheduledAt");

CREATE TABLE "Prediction" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "matchEventId"     TEXT NOT NULL,
    "predictedHome"    INTEGER NOT NULL,
    "predictedAway"    INTEGER NOT NULL,
    "xpEarned"         INTEGER NOT NULL DEFAULT 0,
    "isScored"         BOOLEAN NOT NULL DEFAULT false,
    "isExact"          BOOLEAN NOT NULL DEFAULT false,
    "isCorrectResult"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Prediction_userId_matchEventId_key" ON "Prediction"("userId", "matchEventId");
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX "Prediction_matchEventId_idx" ON "Prediction"("matchEventId");
CREATE INDEX "Prediction_isScored_idx" ON "Prediction"("isScored");

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchEventId_fkey"
    FOREIGN KEY ("matchEventId") REFERENCES "MatchEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FanClub" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "sport"        TEXT NOT NULL,
    "teamName"     TEXT,
    "description"  TEXT,
    "badge"        TEXT,
    "primaryColor" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanClub_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FanClub_sport_idx" ON "FanClub"("sport");
CREATE INDEX "FanClub_name_idx" ON "FanClub"("name");

CREATE TABLE "FanClubMember" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "fanClubId" TEXT NOT NULL,
    "role"      TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanClubMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FanClubMember_userId_fanClubId_key" ON "FanClubMember"("userId", "fanClubId");
CREATE INDEX "FanClubMember_userId_idx" ON "FanClubMember"("userId");
CREATE INDEX "FanClubMember_fanClubId_idx" ON "FanClubMember"("fanClubId");

ALTER TABLE "FanClubMember" ADD CONSTRAINT "FanClubMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanClubMember" ADD CONSTRAINT "FanClubMember_fanClubId_fkey"
    FOREIGN KEY ("fanClubId") REFERENCES "FanClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Highlight" (
    "id"           TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "sport"        TEXT NOT NULL,
    "matchRef"     TEXT,
    "videoUrl"     TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags"         TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qdrantId"     TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Highlight_sport_idx" ON "Highlight"("sport");
CREATE INDEX "Highlight_createdAt_idx" ON "Highlight"("createdAt");
