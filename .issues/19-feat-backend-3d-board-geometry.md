# feat(backend): 3D board geometry — depth axis (Posicion/Direccion/DefinicionTablero + persistence)

**Phase:** 7 (enhancement) · **Story:** C3‴′ (extension of C3) · **Blocked by:** 01, 14
**Cross-repo twin:** `arrowmaze-frontend` ticket 36 — shared golden fixtures must agree (extends
the ticket 14 shaped-board/length-invariant machinery with a depth axis).
**Traceability:** PRD §1.1 ("a future 3D board"), §4 (Posicion/Vector3/Direccion — "2D = 4 dirs,
future 3D = 6, same contract"), §6.1 DM-F1, §8 NFR Portability/Extensibility (OCP)

> The PRD has flagged a 3D board as the target OCP extension for the `Tablero` port since
> inception, but the **backend's** `Posicion`/`Direccion`/`DefinicionTablero` are still
> hard-coded 2D (`Posicion(x, y)`, a 4-value `Direccion` enum, `celdas: Celda[][]`). This
> ticket adds a third axis — `z` ("capa"/layer) — so a `Nivel` can stack multiple
> `ancho × alto` layers into a `profundo`-deep volume, and two new directions (`ADELANTE`
> `/ATRAS`) let a ray travel between layers exactly as it already travels between rows and
> columns. The solvability gate (ticket 01) and the arrow-length-≥2 invariant (ticket 14)
> must hold, unmodified in their rules, across the new axis.

## User story

> **C3‴′ — Author a 3-dimensional, well-formed level.** *As Ops, I publish a multi-layer
> board and trust it is solvable, contains no length-1 arrows, and round-trips its layer
> geometry exactly.*
>
> - **Given** a board definition with `profundo > 1` layers and cells at various `(x, y, z)`,
>   **When** I create the level, **Then** the solver's raycast/edge detection walks all six
>   directions (including the two new depth directions), the arrow-length invariant is
>   enforced along whichever axis a cell's `direccion` points, and creation is **rejected**
>   exactly as for a 2D board if either check fails.

## Deep modules touched

- **DM-B1** — `Posicion` gains `z` (default `0`, so every existing call site stays valid);
  `Direccion` gains `ADELANTE`/`ATRAS` (+z/−z) and `deltaDireccion` covers all six; the
  solvability invariant (ticket 01) and the arrow-length invariant (ticket 14) already live
  in `DefinicionTablero`'s constructor — this ticket makes both **depth-aware**, not
  reimplemented.
- **Solver** — raycast/edge detection consults all six directions. Order-independence and
  greedy completeness (ticket 01) are dimension-agnostic by construction; this ticket adds
  **regression** coverage proving that, not new solver logic.
- **DM-B6** — create/serve DTOs and the Prisma schema/mapper carry `profundo` + `z` per cell.

## Layers crossed

```
DOM   src/domain/value-objects/posicion.ts              (+ z, default 0 — backward compatible)
      src/domain/value-objects/direccion.ts              (+ ADELANTE/ATRAS; deltaDireccion → 3D)
      src/domain/value-objects/definicion-tablero.ts     (+ profundo; celdas indexed [z][y][x];
                                                            length-invariant walk over 6 dirs)
      src/domain/services/solver.ts                       (raycast/edge detection depth-aware)
      src/shared/__fixtures__/golden-boards-3d.ts (NEW)   (+ 3 golden 3D boards, shared w/ Dart)
DTO   src/application/dtos/crear-nivel.dto.ts             (+ profundo; CeldaDto.direccion allows
                                                            'ADELANTE'/'ATRAS')
      src/infrastructure/adapters/http/dtos/crear-nivel-request.dto.ts (+ profundo)
INFRA src/infrastructure/adapters/persistence/mappers/nivel.prisma.mapper.ts
                                                           (3D matrix round-trip: [z][y][x])
DB    prisma/schema.prisma   (Nivel.profundo Int @default(1); CeldaNivel.z Int @default(0))
      prisma/migrations/...  (NEW migration — every existing row already satisfies the new
                              defaults, so no backfill script is needed)
```

> **Persistence note:** backward compatibility is structural, not scripted. Once the columns
> default to `profundo = 1` / `z = 0`, every existing `Nivel`/`CeldaNivel` row is already a
> valid single-layer 3D board — the migration adds columns, it does not touch data.

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Depth-aware domain (`posicion.spec.ts`, `direccion.spec.ts`, `definicion-tablero.spec.ts`, `solver.spec.ts`)
- 🔴 Add `golden-boards-3d.ts` with three fixtures (see below): `minimalSolvable3D`,
  `crossLayerDependencySolvable3D`, `depthAxisUnsolvable3D`. Assert: `deltaDireccion(ADELANTE)`
  / `deltaDireccion(ATRAS)` step `z` by ±1 and leave `x`/`y` at `0`; `DefinicionTablero.crear`
  accepts a `profundo`-layer board and enforces the length-≥2 invariant along a depth-axis ray
  exactly as it does along x/y; the solver returns the correct verdict for all three fixtures;
  every existing 2D golden board (`profundo` defaulted to `1`) is unaffected byte-for-byte
  (regression — no existing spec changes).
- 🟢 Add `z`/`profundo` with defaults; extend `deltaDireccion`, the length-invariant walk, and
  the solver's raycast/edge detection to the two new directions.
- ♻️ Keep the six-direction walk a single loop/table — no `if` branch duplicating the x/y logic
  for depth; one direction table drives both the length invariant and the solver.

### Step 2 — Persistence round-trip (mapper spec + migration)
- 🔴 A 3-layer `Nivel` persisted then reloaded (`toPersistence` → `toDomain`) reproduces the
  exact same `DefinicionTablero` (every cell's `x, y, z, tipo, direccion`); an existing 2D
  fixture round-trips unchanged after the migration lands (regression).
- 🟢 Migration adds `profundo`/`z` columns with defaults; the mapper reads/writes the 3D
  matrix, using absence-of-row = absent position exactly as ticket 14, now scoped per layer.
- ♻️ No duplicated per-layer loop in the mapper — one nested walk over `(z, y, x)`.

### Step 3 — HTTP create/serve e2e (`test/levels.e2e-spec.ts`)
- 🔴 `POST /levels` with a solvable, length-valid 3-layer board → `201`, sparse cells persisted
  with correct `z`; the same request built from `depthAxisUnsolvable3D` → `422`, nothing
  persisted; `GET /levels/:id` on the created level returns the same `profundo` and per-cell
  `z` it was created with.
- 🟢 Wire the DTO fields end-to-end (application DTO, HTTP request DTO, mapper).
- ♻️ No new exception type needed — the existing solvability/length exceptions already
  generalize across axes; map them through the existing presenter.

## Golden 3D fixtures (`src/shared/__fixtures__/golden-boards-3d.ts`)

> Unlike the frontend's `Trayectoria` (a multi-cell path sharing one head direction), the
> backend's `Celda` model has no path/id grouping — every `'flecha'` cell is its own
> independent single-cell arrow with its own `direccion`. These fixtures are the
> backend-model equivalent of `arrowmaze-frontend` ticket 36's three 3D test boards, **not**
> a byte-for-byte mirror; only the minimal-smoke-test and unsolvable fixtures are
> structurally identical across repos.

- `minimalSolvable3D` (1×1, `profundo=2`) — a single arrow travels one cell forward in depth
  before exiting the stack; the z-axis analogue of `golden-boards.ts`'s `solvable`.
- `crossLayerDependencySolvable3D` (2×1, `profundo=2`) — the lower layer's arrow is initially
  blocked by the upper layer's arrow; the upper one's own ray is immediately clear, so
  removing it first unblocks the lower one. Proves greedy order-independence holds across
  the depth axis, not just within a layer.
- `depthAxisUnsolvable3D` (1×1, `profundo=2`) — two single-cell arrows point at each other
  along the depth axis; each satisfies the length-≥2 invariant alone but they block each
  other forever. The z-axis analogue of `golden-boards.ts`'s `unsolvable`.

## Definition of Done
- `Posicion`/`Direccion`/`DefinicionTablero`/solver are depth-aware; the three 3D golden
  boards agree with `arrowmaze-frontend` ticket 36's Dart fixtures.
- Every existing 2D spec (phases 1–6) passes **unmodified** — the depth axis is additive,
  proving PRD §8's OCP promise on this repo.
- 3-layer levels create/serve/persist correctly; nothing unsolvable or length-invalid, on any
  axis, is ever persisted or served.
