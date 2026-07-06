import { config as loadEnv } from 'dotenv';

/**
 * Jest globalSetup for the e2e suite — a safety interlock, not a test.
 *
 * The e2e specs boot the real AppModule and write real rows through the real
 * Prisma client (`POST /levels`, `/progress/sync`, ...). They currently share
 * the app's single `.env`, so without this guard `npm run test:e2e` runs
 * against the production Supabase database — which is exactly how the authored
 * catalogue got wiped and a `hs-progress-*` test artifact leaked into
 * `niveles`.
 *
 * Rule: refuse to run the destructive e2e suite against a hosted/shared
 * database (any `*.supabase.com` / `supabase.co` host). Point the suite at a
 * disposable local/CI database instead (e.g. a Postgres container), or — only
 * if you fully understand the blast radius — set `ALLOW_E2E_ON_SHARED_DB=1`.
 */
export default function guardAgainstSharedDb(): void {
  // AppModule reads .env via @nestjs/config; mirror that here since globalSetup
  // runs before Nest bootstraps.
  loadEnv();

  const url = process.env.DATABASE_URL ?? '';
  const isShared = /supabase\.(co|com)/i.test(url);
  const optedIn = process.env.ALLOW_E2E_ON_SHARED_DB === '1';

  if (isShared && !optedIn) {
    const host = safeHost(url);
    throw new Error(
      [
        '',
        '╳ Refusing to run the e2e suite against a shared/hosted database.',
        `  DATABASE_URL points at: ${host}`,
        '',
        '  The e2e specs write and delete real rows. Running them here is how the',
        '  authored levels were wiped and the hs-progress row leaked into `niveles`.',
        '',
        '  Fix: point DATABASE_URL/DIRECT_URL at a disposable local test database',
        '  (e.g. a Postgres container), typically via a .env.test loaded for tests.',
        '  To override intentionally: ALLOW_E2E_ON_SHARED_DB=1 npm run test:e2e',
        '',
      ].join('\n'),
    );
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '<unparseable DATABASE_URL>';
  }
}
