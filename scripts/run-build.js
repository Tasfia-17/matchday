const { execSync } = require('node:child_process');

const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command) {
  console.log(`[build] ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function main() {
  // ── 1. Migrations (only when a REAL database is available) ─────────────────
  // Check before we inject any placeholder so we never run migrations against
  // the build-time stub URL.
  const hasRealDatabaseUrl = Boolean(process.env.DATABASE_URL);

  if (hasRealDatabaseUrl) {
    console.log('[build] DATABASE_URL detected, running migration safety checks and deploy.');
    run('node scripts/fix-stuck-migration.js');
    run(`${npxBin} prisma migrate deploy`);
  } else {
    console.log('[build] DATABASE_URL not set, skipping migration repair and deploy for local validation builds.');
  }

  // ── 2. Auth fallbacks ───────────────────────────────────────────────────────
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'build-only-insecure-secret';
    console.log('[build] NEXTAUTH_SECRET not set, using a build-only fallback secret.');
  }

  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    console.log('[build] NEXTAUTH_URL not set, using http://localhost:3000 for build-time validation.');
  }

  // ── 3. Prisma build-time placeholder ───────────────────────────────────────
  // Prisma 6 validates DATABASE_URL at PrismaClient construction time (P1012).
  // During Next.js static page generation, the build worker imports every route
  // module, which imports prisma.ts, which calls `new PrismaClient()`.  Without
  // a syntactically valid URL that construction throws and crashes the worker —
  // even when all routes have `export const dynamic = 'force-dynamic'` (because
  // the import/module evaluation happens before the route handler runs).
  //
  // We inject a non-connectable stub URL so the client constructs without error.
  // No actual DB query ever runs at build time: force-dynamic routes are never
  // executed during static generation, they only serve live requests at runtime.
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://build:build@localhost:5432/build_placeholder';
    console.log('[build] DATABASE_URL not set, injecting non-connectable placeholder for build-time Prisma instantiation.');
  }

  // ── 4. Build ────────────────────────────────────────────────────────────────
  run(`${npxBin} prisma generate`);
  run(`${npxBin} next build`);
}

main();
