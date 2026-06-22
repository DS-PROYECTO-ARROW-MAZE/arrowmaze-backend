# feat(backend): proportional star rating from final score

**Phase:** 5 (enhancement) · **Story:** D3 (refinement) · **Blocked by:** 05, 15
**Cross-repo twin:** `arrowmaze-frontend` ticket 19 — **must agree** via golden fixtures.

> The star rating must be **proportional to the final `Puntaje`** rather than read off three
> hand-tuned absolute thresholds. The `Estrellas` (1–3) are derived as a proportion of the
> score achievable on that level, so the rating scales smoothly with performance and stays
> consistent across levels of different `baseNivel`.

## User story

> **D3′ — Stars reflect how well I scored.** *As a player, my 1–3 stars track my `Puntaje`
> as a fraction of what the level is worth, identically on client and backend.*

## Design decision (record in PRD §3 / golden fixtures)

Define the proportion source explicitly and share it cross-repo:

- Stars = a function of `Puntaje / referencia`, where `referencia` is the level's
  achievable maximum (derived from `baseNivel` and the level definition), mapped to 1/2/3
  by **proportional bands** (e.g. ≥⅓ → 1★, ≥⅔ → 2★, ≥ near-max → 3★ — exact bands fixed in
  the fixtures).
- The three existing `umbralesEstrellas` either become **derived** from the proportion, or
  are reinterpreted as proportional cut points. **Bonus levels (ticket 15) produce no
  stars** — the non-scoring path short-circuits before star calculation.

> This changes the *meaning* of the star thresholds, so the golden-score fixtures
> (`golden-scores.ts`) and the agreement test must be updated **in lockstep** with the
> frontend twin, or CI agreement (PRD §7.5) will fail.

## Deep modules touched

- **scoring (TS mirror of DM-F6)** — `CalcularPuntuacionUseCase` star step becomes a
  proportional mapping over `Puntaje`; strategy selection (timed/untimed/bonus) unchanged.
- **FIX** — `src/domain/__fixtures__/golden-scores.ts` regenerated for the proportional model.

## Layers crossed

```
DOM   src/domain/services/scoring/calcular-puntuacion.use-case.ts   (proportional star step)
      src/domain/value-objects/resultado-puntaje.ts                 ({ puntaje, estrellas })
FIX   src/domain/__fixtures__/golden-scores.ts                      (regenerated, shared)
```

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Proportional bands (`calcular-puntuacion.use-case.spec.ts`)
- 🔴 For a fixed level reference, `Puntaje` just below / at / above each proportional band
  yields 1/2/3 stars (boundary tests); a `Puntaje` of 0 yields the minimum; near-max
  yields 3. Band inclusivity is explicit and documented.
- 🟢 Implement the proportional mapping (replacing the absolute-threshold lookup).
- ♻️ Keep `referencia` derived from level data so the algorithm swaps without caller change.

### Step 2 — Bonus short-circuit (`calcular-puntuacion.use-case.spec.ts`)
- 🔴 A bonus level (ticket 15) yields **no** stars (non-scoring result), not 0★.
- 🟢 / ♻️ Ensure the bonus branch returns before star calculation.

### Step 3 — Cross-repo agreement (`golden-scores.spec.ts`)
- 🔴 Regenerate the shared golden fixtures under the proportional model; this
  implementation reproduces every recorded `{Puntaje, Estrellas}`.
- 🟢 / ♻️ The fixtures become the updated cross-repo contract; coordinate the bump with
  frontend ticket 19 so both repos flip together.

## Definition of Done
- Stars are a proportional function of `Puntaje` with boundary-tested bands.
- Bonus levels produce no stars.
- Golden-score fixtures regenerated and agreed with the frontend (PRD §7.5 agreement green).
