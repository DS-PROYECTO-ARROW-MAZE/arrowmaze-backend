# 03 — Update level (re-gated)

**Phase:** 2 · **Story:** C3 (update path) · **Blocked by:** 01

> Mirror of the create slice for the *update* path. The same solvability gate must run on
> edits, so an authored level can never be mutated into a soft-lock.

## User story

> **C3 — Author a level (backend gate).** *As Ops, I publish a level and trust it can't
> soft-lock anyone.*
>
> - **Given** an `ActualizarNivelCasoDeUso` request with a board,
>   **When** the greedy solver cannot empty it,
>   **Then** the request is **rejected** and nothing is persisted (ADR-0001).

## Deep modules touched

- **DM-B1** — reuse `DefinicionTablero` invariant + `Solver` from ticket 01.
- **DM-B2** — `ActualizarNivelCasoDeUso` (`execute(dto) → Result`).
- **DM-B3** — `IRepositorioNivel.obtenerPorId` + `guardar` (upsert semantics already present).
- **DM-B6** — `PUT /levels/:id`.

## Layers crossed

```
HTTP  levels.controller.ts                      (PUT /levels/:id)
DTO   src/application/dtos/actualizar-nivel.dto.ts
APP   src/application/use-cases/actualizar-nivel.use-case.ts
DOM   (reuse) definicion-tablero.ts, solver.ts, nivel.ts, nivel.repository.interface.ts
INFRA (reuse) prisma-nivel.repository.ts, nivel.prisma.mapper.ts
WIRE  levels.module.ts
```

## TDD plan (🔴 → 🟢 → ♻️)

PRD §7.4 ("`CrearNivel`/`ActualizarNivel` reject an unsolvable board → nothing persisted").

### Step 1 — Use case (`actualizar-nivel.use-case.spec.ts`, fake repo)
- 🔴
  - unknown id → `NivelNoEncontradoException`; `guardar` not called.
  - existing id + **unsolvable** board → rejected via `DefinicionTablero`; `guardar` not
    called (spy assertion).
  - existing id + solvable board → `guardar` called once with the **same id** and updated
    definition/constants.
- 🟢 Implement: load by id, rebuild `DefinicionTablero` (gate), persist.
- ♻️ Factor the "parse DTO board → `Nivel`" step shared with ticket 01 into a helper/mapper.

### Step 2 — HTTP e2e (`test/levels.e2e-spec.ts`, extend)
- 🔴 Seed a level → `PUT` with unsolvable board → 422, row unchanged (byte-compare the
  persisted definition). `PUT` with solvable board → 200, row reflects the edit.
- 🟢 Wire the controller route.
- ♻️ Share the error-mapping presenter with ticket 01.

## Definition of Done
- Update path rejects unsolvable boards with the repository provably untouched.
- No duplication of the gate logic — both create and update go through `DefinicionTablero`.
- ≥ 90% coverage on the new use case.
