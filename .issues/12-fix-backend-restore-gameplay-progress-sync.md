# fix(backend): restore gameplay→Supabase progress sync & leaderboard visibility

**Phase:** Hotfix · **Priority:** 1 · **Story:** E2 / E3 (regression) · **Blocked by:** 08, 11 (extends them)
**Cross-repo twin:** `arrowmaze-frontend` ticket 15 (`fix(frontend): flush gameplay progress …`) — must land together.

> **Symptom (reported).** Real gameplay never lands in the database. The only `Progreso`
> rows present in Supabase are the ones inserted by hand via Postman during contract
> testing; runs produced by playing the Flutter client are absent. As a downstream
> effect the **leaderboard is effectively empty / shows only the Postman seed data**.
>
> This ticket owns the **backend half** of the investigation: prove `POST /progress/sync`
> durably persists a payload shaped *exactly* as the client sends it, reconcile the DTO
> contract, and confirm the leaderboard projection reads those rows. The client-side
> flush/queue fix is the frontend twin.

## Leading hypothesis (verify first, do not assume)

The client (frontend ticket 14) posts a batch shaped as:

```json
{ "progresos": [ { "nivelId": "uuid", "estrellas": 3, "movimientos": 12,
                   "tiempoSegundos": 35, "completadoEn": "2026-06-21T20:30:00Z" } ] }
```

but the `Progreso` model / leaderboard read use **`segundosRestantes`**, and ticket 08's
DTO was authored independently. If the sync DTO rejects/ignores `tiempoSegundos` (or the
batch envelope key differs), the request 4xx's or silently drops the field → no rows →
empty leaderboard. **Confirm the actual on-the-wire contract before changing anything.**

## Investigation checklist (Step 0, before any code)

- [ ] Replay the **exact** client payload (capture from the Flutter app / Postman) against
      a running `POST /progress/sync`. Record the status code and response body.
- [ ] Inspect `SincronizarProgresoDto` validation: does an unknown/extra field cause a
      `400` (whitelist/`forbidNonWhitelisted`)? Does a missing `segundosRestantes` fail?
- [ ] Confirm the JWT guard (ticket 06): is the client actually authenticated, or is the
      route open and writing under the wrong/owner-less `jugadorId`?
- [ ] Verify `DATABASE_URL` vs `directUrl`: writes go through the **transaction pooler**;
      confirm migrations ran and the `progresos` table the app writes to is the same one
      Postman/Supabase Studio reads.
- [ ] Query `progresos` grouped by `created_at` / source to confirm gameplay rows are
      genuinely missing (not just filtered out by the leaderboard query).

## Deep modules touched

- **DM-B2** — `SincronizarProgresoCasoDeUso` / `SincronizarProgresoDto` (contract reconcile).
- **DM-B3** — `PrismaRepositorioProgreso.guardarLote` (confirm the `$transaction` commits).
- **DM-B5** — `ConsultaRankingPrisma` (confirm projection includes synced rows).
- **DM-B6** — `progress.controller.ts` (validation pipe, auth guard, error mapping).

## Layers crossed

```
HTTP  src/infrastructure/adapters/http/controllers/progress.controller.ts
DTO   src/application/dtos/sincronizar-progreso.dto.ts        (reconcile field names + envelope)
APP   src/application/use-cases/sincronizar-progreso.use-case.ts
INFRA src/infrastructure/adapters/persistence/repositories/prisma-progreso.repository.ts
TEST  test/progress.e2e-spec.ts                               (NEW: client-shaped payload)
```

## Decision required (record in PRD/ADR + frontend twin)

Pick **one** canonical contract and make both repos speak it. Recommended: keep the
domain term **`segundosRestantes`** (matches `Progreso`, leaderboard, scoring §05) and
fix the client to send it; OR accept `tiempoSegundos` at the DTO edge and map it. Do
**not** leave two divergent names. Whatever is chosen must match the Pact/contract test.

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Reproduce with a client-shaped e2e (🔴 failing) (`test/progress.e2e-spec.ts`)
- 🔴 `POST /progress/sync` with the **verbatim client payload** → assert `201` and that
  `progresos` row count increased by N for the authenticated player. This test should
  **fail today**, capturing the regression.
- 🟢 Reconcile the DTO (field names + envelope key) so the real payload validates and
  persists; re-score server-side via ticket 05 as before.
- ♻️ Tighten the validation pipe so an unknown field is a *loud* `400`, never a silent drop.

### Step 2 — Persistence proof (`prisma-progreso.repository.spec.ts`, test DB)
- 🔴 `guardarLote` of the reconciled batch → exactly N rows visible in a fresh query
  (no open transaction left uncommitted).
- 🟢 / ♻️ Confirm the `$transaction` commits and the connection (pooler) is correct.

### Step 3 — Leaderboard visibility (`test/leaderboard.e2e-spec.ts`)
- 🔴 After syncing gameplay rows, `GET /leaderboard?idNivel=…&limite=10` returns those
  rows (not just the Postman seed), ordered by `puntaje`.
- 🟢 / ♻️ Bust the TTL cache (ticket 11) on the test path; confirm the projection joins
  the synced rows.

## Definition of Done
- A previously-failing e2e using the **real client payload** is green.
- Gameplay-originated rows are demonstrably present in `progresos` and surface in the
  leaderboard.
- A single canonical sync contract is documented and shared with the frontend twin
  (ticket 15); Pact/contract test updated.
