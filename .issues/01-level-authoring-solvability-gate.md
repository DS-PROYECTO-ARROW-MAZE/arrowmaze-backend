# 01 — Level authoring with the solvability gate (keystone)

**Phase:** 1 (foundation — start here) · **Story:** C3 (create path) · **Blocks:** 03, 04, 05, 07, 08, 09

> This is the keystone tracer bullet. It is the first slice that exercises the *level*
> domain end-to-end and, in doing so, builds the shared primitives (`Posicion`,
> `Direccion`, `Celda`, `Tablero`/`GrafoTablero`, the greedy **Solver**) that every
> other level/scoring/progress ticket depends on. We build them here **inside a working
> feature** (`POST /levels`) rather than as a horizontal "domain-only" sprint.

## User story

> **C3 — Author a level (backend gate).** *As Ops, I publish a level and trust it
> can't soft-lock anyone.*
>
> - **Given** a `CrearNivelCasoDeUso` request with a board,
>   **When** the greedy solver cannot empty it,
>   **Then** the request is **rejected** and nothing is persisted/served (ADR-0001).

## Deep modules touched

- **DM-B1** — `Nivel` aggregate + `DefinicionTablero` VO. The solvability invariant is
  enforced **in the type**: `DefinicionTablero` cannot be constructed from an unsolvable
  board. Houses the greedy TS **Solver** (mirror of DM-F4).
- **DM-B2** — `CrearNivelCasoDeUso` (`execute(dto) → Result`): validate → gate → map →
  persist via repository port. **No Unit of Work** (ADR-0003) — single-aggregate
  atomicity via one Prisma nested write.
- **DM-B3** — `IRepositorioNivel` port (`src/domain/repositories`) + `PrismaNivelRepository`
  adapter + `NivelPrismaMapper` + Prisma schema/migration.
- **DM-B6** — HTTP transport: `LevelsController` (`POST /levels`), request/response DTOs.

## Layers crossed (vertical slice)

```
HTTP  src/infrastructure/adapters/http/controllers/levels.controller.ts   (POST /levels)
DTO   src/application/dtos/crear-nivel.dto.ts
APP   src/application/use-cases/crear-nivel.use-case.ts
DOM   src/domain/value-objects/{posicion,direccion,vector3}.ts
      src/domain/value-objects/celda.ts            (Flecha|CeldaPared|CeldaVacia|Coleccionable + FabricaCeldasEstandar)
      src/domain/value-objects/definicion-tablero.ts   (invariant: rejects unsolvable)
      src/domain/services/solver.ts                (greedy esSolvable(tablero))
      src/domain/{aggregates/nivel.ts, repositories/nivel.repository.interface.ts}
      src/domain/exceptions/nivel-no-solvable.exception.ts
INFRA src/infrastructure/adapters/persistence/repositories/prisma-nivel.repository.ts
      src/infrastructure/adapters/persistence/mappers/nivel.prisma.mapper.ts
DB    prisma/schema.prisma  (+ migration)
WIRE  src/infrastructure/modules/levels.module.ts  (+ register in app.module.ts)
```

## Persistence (PRD §6.3)

Add `Nivel`/level-definition tables: board + cells, scoring constants
(`baseNivel`, `Kmov`, `Ktiempo`), `umbralesEstrellas`, `limiteTiempo?`, `dificultad`.
Level + cells persist via **one Prisma nested write** — no `$transaction`, no UoW.

## TDD plan (🔴 red → 🟢 green → ♻️ refactor)

Follow PRD §7.4. Build inside-out per slice, each step test-first.

### Step 1 — Solver (`src/domain/services/solver.spec.ts`)
- 🔴 Write `esSolvable` tests against **golden boards** (create
  `src/domain/__fixtures__/golden-boards.ts`, shared shape with the Dart repo):
  - known-solvable board → `true`
  - known-unsolvable board → `false`
  - **order-independence (property test):** shuffle the legal removal order N times →
    same verdict every time (PRD §7.4).
  - `CeldaVacia` is transparent: a ray flies over empty cells without interacting.
- 🟢 Implement the greedy loop: repeatedly remove any arrow whose ray to the edge is
  clear; solvable **iff** the board empties.
- ♻️ Extract raycast/edge-detection into `Tablero`/`GrafoTablero` (incremental unlink on
  removal — never a full rebuild). Solver stays a boolean over the port.

### Step 2 — `DefinicionTablero` invariant (`definicion-tablero.spec.ts`)
- 🔴 `DefinicionTablero.crear(board)` on an **unsolvable** board throws
  `NivelNoSolvableException`; on a solvable board returns a frozen VO.
- 🟢 Make construction call the solver and throw on failure.
- ♻️ Ensure it's impossible to obtain an instance any other way (private ctor + static
  factory, mirroring `ValueObject` stereotype).

### Step 3 — `CrearNivelCasoDeUso` (`crear-nivel.use-case.spec.ts`, fake repo)
- 🔴 With a **fake `IRepositorioNivel`**:
  - unsolvable board → use case rejects **and `repositorio.guardar` is never called**
    (assert spy not invoked — PRD §7.4).
  - solvable board → `guardar` called exactly once with a `Nivel` carrying the parsed
    scoring constants / thresholds.
- 🟢 Implement: build `DefinicionTablero` (gate), build `Nivel`, call port.
- ♻️ Move parsing/mapping of the DTO board → cells into `FabricaCeldasEstandar`.

### Step 4 — Persistence integration (`prisma-nivel.repository.spec.ts`, test DB)
- 🔴 `guardar` persists level + cells in **one** nested write; round-trips via
  `obtenerPorId` to an equal `Nivel`.
- 🟢 Implement repo + mapper + schema/migration.
- ♻️ Confirm no `$transaction`/UoW (single aggregate, ADR-0003).

### Step 5 — HTTP e2e (`test/levels.e2e-spec.ts`)
- 🔴 `POST /levels` with unsolvable board → **422** (or domain-mapped error), DB row count
  unchanged. With solvable board → **201**, row persisted.
- 🟢 Wire controller + module.
- ♻️ Map `NivelNoSolvableException` to the HTTP error DTO in a presenter/filter (DM-B6).

## Definition of Done
- All five spec layers green; domain/application ≥ 90% coverage for new code.
- Solver verdicts match the shared golden fixtures (basis for cross-repo ADR-0001 check).
- No framework import in `src/domain`. Names match PRD §4 (no `CeldaSalida`).
