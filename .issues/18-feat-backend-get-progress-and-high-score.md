# feat(backend): GET /progress restore endpoint + high-score read guarantee

**Phase:** 6 (enhancement) · **Story:** E2/E4 (restore) + E2′ (high-score) · **Blocked by:** 08, 11, 13
**Cross-repo twin:** `arrowmaze-frontend` ticket 24 (`fix(frontend): restore unlocked levels on login & refresh on back-nav`) — must share one contract.

> Today a returning player who logs in on a fresh device sees **no** unlocked levels: there is
> no read path that hands the client its historical progress. The client can only *write*
> progress (`POST /progress/sync`). This ticket adds the **authoritative read**: a new
> `GET /progress` endpoint returning the authenticated player's **best result per level**, so
> the frontend can rebuild its unlock/progression state on login. It also **validates** that
> the high-score rule (ticket 13) holds end-to-end: the read must surface exactly the
> strictly-highest `puntaje` per `(jugador, nivel)` and never a stale or duplicated row.

## User story

> **E4 — Restore my progress on login.** *As a registered player signing in on any device, I
> get back every level I have completed with my best score and stars, so my unlocked levels
> reappear instead of starting from scratch.*
>
> - **Given** a player with stored progress on levels 1–4 (best `puntaje` per level),
>   **When** the client calls `GET /progress` with a valid JWT,
>   **Then** the response lists one entry per completed level — `nivelId`, `puntaje`,
>   `estrellas`, `movimientos`, `segundosRestantes`, `completadoEn` — each being that level's
>   **single best** record, ordered deterministically, and **never** more than one row per level.
> - **Given** a player with no progress, **When** they call `GET /progress`, **Then** the
>   response is `200` with an empty collection (not a `404`).

## Deep modules touched

- **DM-B3** — a read method on the progress port (e.g. `RepositorioProgreso.obtenerPorJugador`)
  or a dedicated `IConsultaProgreso` read port (CQRS-lite, mirroring DM-B5). It returns **one
  row per level** — the high-score row guaranteed by ticket 13's `@@unique([jugadorId, nivelId])`.
- **DM-B2** — `ObtenerProgresoCasoDeUso` orchestrates the read (no Prisma in application).
- **DM-B6** — `progress.controller.ts` gains a JWT-guarded `GET /progress` handler + presenter.

## High-score validation (ticket 13 end-to-end)

This ticket **does not re-implement** the strictly-greater upsert (that is ticket 13) — it
**proves it from the read side**: after syncing `800` then `780` then `850` for one level, the
endpoint must return exactly `850`; ties and worse runs must never appear. If the read shows a
duplicate or a non-best row, the bug is in ticket 13's write path and must be reconciled here.

## Layers crossed

```
HTTP  src/infrastructure/adapters/http/controllers/progress.controller.ts   (+ GET /progress)
APP   src/application/use-cases/obtener-progreso.use-case.ts                 (NEW)
APP   src/application/dtos/progreso-respuesta.dto.ts                         (NEW response DTO)
DOM   src/domain/repositories/repositorio-progreso.ts                       (+ read signature)
INFRA src/infrastructure/adapters/persistence/repositories/prisma-progreso.repository.ts
      (read query: best-per-level for a jugador; no $transaction needed for a pure read)
TEST  test/progress.e2e-spec.ts                                             (GET path)
TEST  src/application/use-cases/obtener-progreso.use-case.spec.ts           (NEW)
```

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Use case over a fake port (`obtener-progreso.use-case.spec.ts`)
- 🔴 Given a fake port returning best-per-level rows for a `jugadorId`, the use case maps them
  to `ProgresoRespuestaDto[]`; an empty port → empty list (never throws). No Prisma imported
  (reinforced by ticket 07 guard).
- 🟢 Implement the use case calling the read port only.
- ♻️ Keep mapping in a small named mapper; the use case stays orchestration-only.

### Step 2 — Read query returns best-per-level (`prisma-progreso.repository.spec.ts`, test DB)
- 🔴 Seed two synced runs for the same `(jugador, nivel)` (`800` then `850` after ticket 13's
  upsert) → the read returns **one** row with `850`. Seed two distinct levels → two rows.
  A different player's rows are excluded.
- 🟢 Implement the read query (one row per level, scoped to the jugador).
- ♻️ Express ordering as a named, deterministic sort (e.g. by `nivel.numero`).

### Step 3 — Guarded endpoint e2e (`test/progress.e2e-spec.ts`)
- 🔴 `GET /progress` without a JWT → `401`; with a valid JWT for a player with progress →
  `200` + best-per-level payload; for a player with none → `200` + `[]`. Sync `780` after an
  existing `850` then re-read → still `850` (high-score guarantee from the read side).
- 🟢 Wire controller + guard + presenter.
- ♻️ Map to the canonical response DTO and document the Pact contract shared with frontend 24.

## Definition of Done
- `GET /progress` is JWT-guarded, read-only, returns best-per-level (one row per level), and
  `200`+empty for no-progress players.
- High-score rule verified from the read side (worse/equal runs never surface; only the best).
- Canonical response contract documented and shared with frontend ticket 24 (Pact updated).

---
**Working agreement (mandatory):** strict **TDD** (🔴→🟢→♻️; tests target deep-module
interfaces, not internals — PRD §7). **Clean Architecture / Dependency Rule** (ADR-0004): the
`application` layer **never imports Prisma**; the domain imports no framework. Use the
**ubiquitous language** verbatim (PRD §4); the avoid-list is linted by ticket 07. Coverage
gate: domain + application ≥ **90%** lines.
