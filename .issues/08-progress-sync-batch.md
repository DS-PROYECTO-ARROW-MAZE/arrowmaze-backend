# 08 — Progress sync batch (`$transaction` inside the adapter)

**Phase:** 3 · **Story:** E2 · **Blocked by:** 01, 05

> Durable home for completed offline runs. The whole batch persists **atomically** inside
> a repository-scoped `$transaction` (ADR-0003: no Unit of Work; the transaction is
> **encapsulated in the adapter**, the application layer never naming Prisma). Backend
> re-computes `{Puntaje, Estrellas}` via ticket 05 so synced scores are trustworthy, not
> client-asserted — hence the dependency on 05.

## User story

> **E2 — Sync offline progress.** *As a returning player, my offline runs upload.*
>
> - **Given** a queue of completed runs, **When** I sync, **Then** they persist as one
>   batch inside a repository-scoped `$transaction` (`RepositorioProgreso.guardarLote`),
>   the application layer never naming Prisma (ADR-0003).

## Deep modules touched

- **DM-B3** — `RepositorioProgreso` port with `guardarLote(...)`; `$transaction`
  encapsulated in `PrismaRepositorioProgreso`.
- **DM-B2** — `SincronizarProgresoCasoDeUso` (re-scores each run via ticket 05's
  `CalcularPuntuacionUseCase`, then hands the batch to the port).
- **DM-B6** — `POST /progress/sync` (auth-guarded via ticket 06 if available, else open MVP).

## Layers crossed

```
HTTP  src/infrastructure/adapters/http/controllers/progress.controller.ts  (POST /progress/sync)
DTO   src/application/dtos/sincronizar-progreso.dto.ts        (array of runs)
APP   src/application/use-cases/sincronizar-progreso.use-case.ts
DOM   src/domain/entities/progreso.ts
      src/domain/repositories/progreso.repository.interface.ts   (guardarLote)
INFRA src/infrastructure/adapters/persistence/repositories/prisma-progreso.repository.ts  ($transaction here)
      src/infrastructure/adapters/persistence/mappers/progreso.prisma.mapper.ts
DB    prisma/schema.prisma  (+ migration: Progreso table)
WIRE  src/infrastructure/modules/progress.module.ts
```

## Persistence (PRD §6.3)

`Progreso` per player/level run: `movimientos`, `segundosRestantes`, `puntaje`,
`estrellas`, `completadoEn`, FK to player + level.

## TDD plan (🔴 → 🟢 → ♻️)

Follow PRD §7.7 (atomic batch; mid-batch failure rolls back all; no partial rows).

### Step 1 — Use case (`sincronizar-progreso.use-case.spec.ts`, fakes)
- 🔴
  - a batch of N runs → each run is re-scored via the (faked) `CalcularPuntuacionUseCase`
    and the **recomputed** `{puntaje, estrellas}` is what gets persisted (not the client's
    claimed values).
  - the use case calls `repositorioProgreso.guardarLote(batch)` **once** with all N runs
    (not N single saves).
  - the use case **does not import Prisma / `$transaction`** (dependency rule).
- 🟢 Implement: map DTO → `Progreso[]`, re-score, single `guardarLote`.
- ♻️ Keep scoring injection clean (reuse ticket 05 use case).

### Step 2 — Repository atomicity (`prisma-progreso.repository.spec.ts`, test DB)
- 🔴
  - happy path: `guardarLote` of N runs → exactly N rows.
  - **mid-batch failure** (e.g. inject a row that violates a constraint at position k) →
    `$transaction` rolls back → **zero** rows persisted (assert no partial rows).
- 🟢 Implement `guardarLote` wrapping the writes in `prisma.$transaction([...])`.
- ♻️ Confirm the `$transaction` is **only** inside this adapter (ADR-0003).

### Step 3 — HTTP e2e (`test/progress.e2e-spec.ts`)
- 🔴 `POST /progress/sync` with a valid batch → 200/201 and rows present; a batch with one
  invalid run → error and **no** rows written.
- 🟢 Wire controller + module.
- ♻️ Map domain errors to DTO; guard the route if ticket 06 is merged.

## Definition of Done
- All-or-nothing batch persistence proven (partial-failure test green).
- Scores are server-recomputed via ticket 05 (no blind trust of client numbers).
- Application layer Prisma-free (reinforced by ticket 07's guard).
