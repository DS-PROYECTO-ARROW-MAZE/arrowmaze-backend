# 11 — Leaderboard read projection + TTL cache

**Phase:** 4 · **Story:** E3 · **Blocked by:** 08

> The final slice: a **read-only** CQRS-lite projection over synced progress, served
> through a transport-level cache. There is **no client write path** — the leaderboard
> only reads (no `RankingRepository.publicar`, PRD §9.5). Needs persisted `Progreso` rows
> from ticket 08 to project.

## User story

> **E3 — Leaderboard (read projection).** *As a player, I see top scores per level.*
>
> - **Given** synced progress, **When** I open the leaderboard, **Then** I read a top-N
>   projection (`IConsultaRanking`) served through a ~60s TTL cache keyed by
>   `(idNivel, limite)` (`InterceptorCacheRanking`). The leaderboard is read-only.

## Deep modules touched

- **DM-B5** — `IConsultaRanking.obtenerTop(idNivel, limite) → RankingDto` +
  `ConsultaRankingPrisma` (read-optimised query) + `InterceptorCacheRanking` (~60s TTL,
  keyed by `(idNivel, limite)`).
- **DM-B6** — `GET /leaderboard?idNivel&limite`.

## Layers crossed

```
HTTP  src/infrastructure/adapters/http/controllers/leaderboard.controller.ts  (GET /leaderboard)
      src/infrastructure/adapters/http/interceptors/interceptor-cache-ranking.ts
DTO   src/application/dtos/ranking.dto.ts
APP   src/application/queries/consulta-ranking.interface.ts    (IConsultaRanking — read port)
INFRA src/infrastructure/adapters/persistence/queries/consulta-ranking-prisma.ts
WIRE  src/infrastructure/modules/leaderboard.module.ts
```
> Note: this is a **query** port (read side), deliberately separate from the
> write-side `IRepositorio*` ports.

## TDD plan (🔴 → 🟢 → ♻️)

Follow PRD §7.7 (top-N per `(idNivel, limite)`; second call within TTL served from cache;
read-only).

### Step 1 — Read query (`consulta-ranking-prisma.spec.ts`, test DB)
- 🔴 Seed `Progreso` rows (via ticket 08) → `obtenerTop(idNivel, limite)` returns the top
  `limite` by `puntaje` descending for that level only; ties broken deterministically;
  other levels excluded.
- 🟢 Implement the read-optimised Prisma query + mapping to `RankingDto`.
- ♻️ Keep it a pure read (no writes); index hint noted in schema if needed.

### Step 2 — Cache interceptor (`interceptor-cache-ranking.spec.ts`)
- 🔴 Two `GET /leaderboard` calls with the same `(idNivel, limite)` within TTL → the read
  port (`IConsultaRanking`) is invoked **once** (spy asserts DB query not re-issued on the
  2nd call); a different key bypasses the cached entry; after TTL expiry the port is hit
  again.
- 🟢 Implement the interceptor with a ~60s TTL keyed by `(idNivel, limite)`.
- ♻️ Make TTL configurable; ensure the cache lives at the transport edge, invisible to the port.

### Step 3 — Read-only guard
- 🔴 A test/grep assertion that there is **no** `publicar`/write path on the ranking side
  (PRD §9.5) — only `obtenerTop`.
- 🟢 / ♻️ — keep the surface read-only.

### Step 4 — HTTP e2e (`test/leaderboard.e2e-spec.ts`)
- 🔴 Seed progress → `GET /leaderboard?idNivel=…&limite=3` → 200 with ≤3 ordered entries;
  immediate repeat is cache-served.
- 🟢 Wire controller + interceptor + module.
- ♻️ Document the DTO (Swagger) for the Pact contract.

## Definition of Done
- Top-N projection correct and ordered; second call within TTL provably skips the DB.
- No write path on the ranking side (read-only confirmed).
- Endpoint DTO stable for the client Pact contract.
