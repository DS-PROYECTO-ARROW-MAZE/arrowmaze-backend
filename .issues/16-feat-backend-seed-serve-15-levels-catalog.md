# feat(backend): seed & serve 15+ ordered levels with scaling complexity (catalog)

**Phase:** 5 (enhancement) · **Story:** C2 (extension) · **Blocked by:** 04, 14, 15
**Cross-repo twin:** `arrowmaze-frontend` ticket 17 (level catalog consumes this).

> The game needs a real progression of **at least 15 levels**, identified by the integer
> ordinal `numero` (1, 2, 3 …), where **complexity increases with the level number** — more
> cells and more arrows as `numero` grows. This ticket authors/seeds that content (each
> board passing the solvability gate of ticket 01 and the arrow-length-≥2 invariant of
> ticket 14) and exposes an **ordered catalog** endpoint the client can list.

## User story

> **C2′ — List the level catalog.** *As a player, I can fetch the ordered list of levels so
> the client can show a selection menu and lock what I haven't reached.*
>
> - **Given** ≥15 seeded levels, **When** I `GET /levels`, **Then** I receive them ordered
>   by `numero`, each with `{ numero, nombre, dificultad, esBonus, ancho, alto }` summary
>   data (board cells fetched on demand via `GET /levels/:id`, ticket 04).

## Complexity-scaling rule (must be explicit, not eyeballed)

A documented, monotonic relationship between `numero` and board size/arrow count, e.g. a
`PerfilDificultad(numero)` helper returning target cell/arrow counts that rise with the
ordinal. Levels 1–9 untimed, 10+ timed (ticket 15); include **at least one bonus level**
to exercise the non-scoring path. Authoring must produce **genuinely solvable** boards —
not 15 copies of level 01 (the divergence frontend ticket 13 flagged as content debt).

## Deep modules touched

- **DM-B1/B2** — reuse `CrearNivelCasoDeUso` + the solvability/arrow-length/ordinal
  invariants to author each level (no bypass of the gate).
- **DM-B6** — `GET /levels` ordered catalog projection (summary DTO) + Prisma seed script.
- **DB** — `prisma/seed.ts` (or a migration-time seed) inserting the 15+ levels idempotently.

## Layers crossed

```
SEED  prisma/seed.ts                                  (NEW: 15+ levels via the create path)
HTTP  src/infrastructure/adapters/http/controllers/levels.controller.ts   (GET /levels)
DTO   src/application/dtos/nivel-resumen.dto.ts        (NEW: catalog summary)
APP   src/application/queries/listar-niveles.interface.ts                  (read port)
INFRA src/infrastructure/adapters/persistence/queries/listar-niveles-prisma.ts
DOM   src/domain/services/perfil-dificultad.ts         (NEW: numero → size/arrow targets)
```

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Complexity profile (`perfil-dificultad.spec.ts`)
- 🔴 `PerfilDificultad(numero)` is monotonic non-decreasing in cells and arrows across
  1…15; level 10 ≥ level 1; the profile honours the timed/untimed boundary.
- 🟢 Implement the profile.
- ♻️ Keep it pure data/derivation (no I/O), reusable by the frontend generator contract.

### Step 2 — Seed integrity (`prisma/seed.spec.ts` or seed e2e, test DB)
- 🔴 Running the seed inserts **≥15** levels with **distinct** `numero` 1…N; every seeded
  board passes `esSolvable` and the arrow-length-≥2 invariant; re-running the seed is
  **idempotent** (no duplicates). At least one `esBonus` level exists.
- 🟢 Author the boards through `CrearNivelCasoDeUso` (gate not bypassed).
- ♻️ Factor board construction so adding level 16+ is data, not code.

### Step 3 — Catalog endpoint (`test/levels.e2e-spec.ts`)
- 🔴 `GET /levels` → levels ordered by `numero` ascending with summary fields only; board
  cells absent from the list payload (fetched per-id via ticket 04).
- 🟢 Wire the read query + controller route.
- ♻️ Keep it a pure read port (no write side).

## Definition of Done
- ≥15 solvable, gate-passing levels seeded with distinct integer `numero` and ≥1 bonus.
- Complexity provably scales with `numero`.
- `GET /levels` serves the ordered catalog; seed is idempotent.
