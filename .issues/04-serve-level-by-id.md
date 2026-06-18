# 04 — Serve level by id (re-validated before serve)

**Phase:** 2 · **Story:** C2 (backend serve path) · **Blocked by:** 01

> The read side of the level pipeline. A client loading an authored level via the backend
> must receive a board re-validated for solvability **before it is served** — defence in
> depth, regardless of source (ADR-0001: "a bad level can never be served").

## User story

> **C2 — Load level by id.** *As a player, I can load a specific authored level.*
>
> - **Given** a level id, **When** it is loaded via the backend,
>   **Then** it is validated for solvability before render, regardless of source.

## Deep modules touched

- **DM-B1** — `Solver` / `DefinicionTablero` (re-validate on read).
- **DM-B3** — `IRepositorioNivel.obtenerPorId`.
- **DM-B6** — `GET /levels/:id` + response DTO (the wire contract the client binds to;
  Pact-shaped — keep field names stable).

## Layers crossed

```
HTTP  levels.controller.ts                          (GET /levels/:id)
DTO   src/application/dtos/definicion-nivel.dto.ts   (response shape)
APP   src/application/use-cases/obtener-nivel.use-case.ts
DOM   (reuse) nivel.repository.interface.ts, solver.ts
INFRA (reuse) prisma-nivel.repository.ts, mapper
PRES  src/infrastructure/adapters/http/presenters/nivel.presenter.ts  (Nivel → DTO)
```

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Use case (`obtener-nivel.use-case.spec.ts`, fake repo)
- 🔴
  - unknown id → `NivelNoEncontradoException`.
  - found level → returned definition; assert the solver was consulted before returning
    (spy on solver / re-construction of `DefinicionTablero`).
  - a stored-but-now-unsolvable board (corruption simulation via fake) → **not served**;
    raises an integrity error rather than returning a soft-lock.
- 🟢 Implement: load → re-validate → return.
- ♻️ Reuse `DefinicionTablero.crear` so re-validation is the same code path as authoring.

### Step 2 — Presenter / DTO (`nivel.presenter.spec.ts`)
- 🔴 `Nivel` maps to the response DTO with stable field names (`baseNivel`, `Kmov`,
  `Ktiempo`, `umbralesEstrellas`, `limiteTiempo?`, `dificultad`, cells). No domain types leak.
- 🟢 Implement the presenter.
- ♻️ Keep DTO shape aligned with what the frontend Pact consumer expects (PRD §7.8).

### Step 3 — HTTP e2e (`test/levels.e2e-spec.ts`, extend)
- 🔴 Seed via ticket-01 create → `GET /levels/:id` → 200 with the DTO; unknown id → 404.
- 🟢 Wire the route + presenter.
- ♻️ Centralise not-found mapping.

## Definition of Done
- Every served level passes the solvability check on the read path (asserted).
- Response DTO is stable and documented (Swagger `@ApiProperty`) for the Pact contract.
