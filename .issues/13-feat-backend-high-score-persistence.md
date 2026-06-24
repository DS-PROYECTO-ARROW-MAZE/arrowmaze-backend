# feat(backend): high-score persistence (strictly-higher upsert on progress sync)

**Phase:** 5 (enhancement) · **Story:** E2 (refinement) · **Blocked by:** 08, 12
**Cross-repo:** scores are server-recomputed (ticket 05) before the comparison.

> Today `guardarLote` **appends** one `Progreso` row per synced run, so a player who
> replays a level worse than before still writes a row and can pollute their own ranking.
> The product rule is **high-score persistence**: per player **per level**, the database
> keeps only the player's best result. On sync the backend updates the stored progress
> **only if the newly recomputed `puntaje` is strictly greater** than the stored one;
> otherwise the existing high score is retained unchanged.

## User story

> **E2′ — Keep my best.** *As a returning player, syncing a run that beats my previous
> best updates my record; syncing a worse or equal run leaves my best untouched.*
>
> - **Given** a stored best of `puntaje = 800` for `(jugador, nivel)`,
>   **When** I sync a run that re-scores to `850`, **Then** the row updates to `850`
>   (and its moves/seconds/stars/`completadoEn`).
>   **When** I sync a run that re-scores to `780` **or** exactly `800`, **Then** the
>   stored `800` is retained and nothing changes (`strictly greater` ⇒ ties do not update).

## Deep modules touched

- **DM-B3** — `RepositorioProgreso`: `guardarLote` semantics change from *insert-many* to
  *upsert-best-per-(jugador,nivel)*; the strictly-higher comparison stays **inside the
  adapter's `$transaction`** (ADR-0003), the application layer never naming Prisma.
- **DB** — `Progreso` gains `@@unique([jugadorId, nivelId])` so "best per level" is a DB
  invariant, plus a migration that **collapses any existing duplicate rows to the max
  `puntaje`** before adding the constraint.

## Layers crossed

```
DB    prisma/schema.prisma            (+ @@unique([jugadorId, nivelId]); + migration w/ dedup)
INFRA src/infrastructure/adapters/persistence/repositories/prisma-progreso.repository.ts
APP   src/application/use-cases/sincronizar-progreso.use-case.ts   (re-score still first)
```

## Persistence decision

- Best-per-level is enforced by the unique index; the write is a Prisma `upsert`
  (or conditional update) **guarded by a strictly-greater check** so a losing run is a
  no-op, not an overwrite-to-worse.
- The leaderboard (ticket 11) now reads at most one row per player/level — its top-N
  ordering is unchanged but no longer needs to de-dupe per player.

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Comparison policy unit (`prisma-progreso.repository.spec.ts`, test DB)
- 🔴
  - first sync for `(jugador, nivel)` → row created with the run's values.
  - sync a **higher** `puntaje` → row updated (puntaje + movimientos + segundosRestantes +
    estrellas + completadoEn all replaced).
  - sync a **lower** `puntaje` → **no change** (assert stored row identical).
  - sync an **equal** `puntaje` → **no change** (strictly-greater ⇒ ties retained).
  - a batch containing two runs of the *same* level keeps only the max (no partial rows).
- 🟢 Implement the strictly-higher upsert inside the existing `$transaction`.
- ♻️ Keep the comparison a small, named predicate (`esMejorPuntaje`) for clarity/reuse.

### Step 2 — Migration safety (`migration` + repo spec)
- 🔴 Given pre-existing duplicate rows for a `(jugador, nivel)`, the migration leaves
  exactly one row carrying the **max** `puntaje`; adding the unique index does not fail.
- 🟢 Write the data-migration step before the constraint.
- ♻️ Document the irreversibility note (dedup is lossy) in the migration.

### Step 3 — Use case unchanged contract (`sincronizar-progreso.use-case.spec.ts`)
- 🔴 The use case still re-scores each run via ticket 05 **before** handing the batch to
  the port; it does not itself know the comparison rule (stays in the adapter).
- 🟢 / ♻️ No Prisma import in application (reinforced by ticket 07 guard).

## Definition of Done
- Strictly-greater update proven (lower **and** equal runs are no-ops).
- `@@unique([jugadorId, nivelId])` migration runs on a DB with pre-existing duplicates.
- Leaderboard now reflects each player's single best per level.
