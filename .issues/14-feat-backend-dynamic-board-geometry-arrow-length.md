# feat(backend): dynamic board geometry (shaped boards) + arrow-length-≥2 invariant

**Phase:** 5 (enhancement) · **Story:** C3 (extension) · **Blocked by:** 01
**Cross-repo twin:** `arrowmaze-frontend` ticket 16 — shared golden fixtures must agree.

> Levels are no longer constrained to filled `ancho × alto` rectangles. A board may take a
> **shape** — heart, triangle, star, etc. — by marking some grid positions as *absent*
> (not part of the playable region), so the count and arrangement of real cells varies.
> The solver and `DefinicionTablero` invariant must treat absent positions correctly, and
> a new domain rule must hold across **all** boards: **an arrow's path is never a single
> cell — its minimum length is always 2 cells.**

## User story

> **C3″ — Author a shaped, well-formed level.** *As Ops, I publish a heart-shaped board and
> trust it is solvable and contains no length-1 arrows.*
>
> - **Given** a board whose playable region is a non-rectangular mask,
>   **When** I create the level, **Then** the bounding box stores the mask, the greedy
>   solver only traverses playable cells, and creation is **rejected** if the board is
>   unsolvable **or** if any arrow would resolve to a single-cell move.

## Deep modules touched

- **DM-B1** — `DefinicionTablero` VO carries a **cell mask** over its `ancho × alto`
  bounding box (which positions are playable). The solvability invariant already lives in
  the type (ticket 01); add the **arrow-length ≥ 2** invariant here so an instance cannot
  be constructed with a degenerate arrow.
- **Solver** — `esSolvable` raycasting skips *absent* positions as non-existent (distinct
  from `CeldaVacia`, which is present-but-transparent); edge detection respects the mask.
- **DM-B6** — create/serve DTOs gain an optional shape/mask representation.

## Layers crossed

```
DOM   src/domain/value-objects/definicion-tablero.ts   (+ mask; + arrow-length invariant)
      src/domain/services/solver.ts                    (mask-aware raycast/edge detection)
      src/domain/exceptions/flecha-longitud-invalida.exception.ts   (NEW)
      src/domain/__fixtures__/golden-boards.ts          (+ shaped boards, shared w/ Dart)
DTO   src/application/dtos/crear-nivel.dto.ts           (shape/mask field)
INFRA src/infrastructure/adapters/persistence/mappers/nivel.prisma.mapper.ts
DB    prisma/schema.prisma   (CeldaNivel already keyed by (x,y); absent positions = no row)
```

> Persistence note: a shaped board is naturally representable today — `CeldaNivel` rows
> exist only for playable positions, so *absent* = no row. The mask is derived on load.
> Confirm the mapper round-trips a sparse board without inventing filler cells.

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Mask-aware solver (`solver.spec.ts`)
- 🔴 Add shaped golden boards (triangle, heart) to `golden-boards.ts`: known-solvable →
  `true`, known-unsolvable → `false`; a ray crossing an **absent** position behaves as if
  the cell does not exist (it is not a transparent `CeldaVacia`). Order-independence still
  holds on the masked region.
- 🟢 Make raycast/edge detection consult the mask.
- ♻️ Keep "absent" vs "empty" a single clearly-named concept in `Tablero`/`GrafoTablero`.

### Step 2 — Arrow-length invariant (`definicion-tablero.spec.ts`)
- 🔴 Constructing a `DefinicionTablero` containing an arrow whose ray resolves to a
  single cell throws `FlechaLongitudInvalidaException`; length-2-or-more arrows are
  accepted; the floor is **inclusive of 2**.
- 🟢 Enforce the check during construction (alongside the solvability gate).
- ♻️ Express "minimum length 2" as a named constant, not a magic number.

### Step 3 — Create e2e (`test/levels.e2e-spec.ts`)
- 🔴 `POST /levels` with a shaped, solvable, length-valid board → `201`, sparse cells
  persisted; a board with a length-1 arrow → `422`, nothing persisted.
- 🟢 Wire DTO/mapper.
- ♻️ Map the new exception to the HTTP error DTO (presenter/filter, DM-B6).

## Definition of Done
- Solver and `DefinicionTablero` are mask-aware; shaped golden boards agree across repos.
- No level can be created/served with a single-cell arrow (invariant enforced in the type).
- Sparse boards round-trip through persistence without filler cells.
