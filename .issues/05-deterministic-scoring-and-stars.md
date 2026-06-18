# 05 — Deterministic scoring & stars

**Phase:** 2 · **Stories:** D1, D2, D3 · **Blocked by:** 01

> The backend mirror of the frontend scoring deep module (DM-F6). The success metric
> (PRD §1.4) is **agreement**: client and backend must return identical `{Puntaje,
> Estrellas}` for the same input. This ticket builds the TS scoring strategies and proves
> agreement via shared golden fixtures. It is a prerequisite for trustworthy progress sync
> (ticket 08) and leaderboard (ticket 11).

## User stories

> **D1 — Deterministic score.** `Puntaje = max(0, baseNivel − movimientos·Kmov +
> segundosRestantes·Ktiempo)`; the time term is dropped on untimed levels.
>
> **D2 — Strategy selection.** Timed → `PuntuacionMixta`; untimed →
> `PuntuacionPorMovimientos`. (`PuntuacionPorTiempo` **does not exist**.)
>
> **D3 — Stars.** Given a `Puntaje` and the three `umbralesEstrellas` thresholds,
> return both `Puntaje` and a 1–3 `Estrellas` rating.

## Deep modules touched

- **Scoring (TS mirror of DM-F6):** `EstrategiaPuntuacion` interface + `PuntuacionMixta`
  / `PuntuacionPorMovimientos` strategies + `CalcularPuntuacionUseCase` returning
  `{ Puntaje, Estrellas }`. Thresholds/constants are **data** read from `DefinicionNivel`
  (ticket 01), so the algorithm swaps without touching callers.

## Layers crossed

```
DOM   src/domain/services/scoring/estrategia-puntuacion.interface.ts
      src/domain/services/scoring/puntuacion-mixta.ts
      src/domain/services/scoring/puntuacion-por-movimientos.ts
      src/domain/value-objects/resultado-puntaje.ts        ({ puntaje, estrellas })
APP   src/application/use-cases/calcular-puntuacion.use-case.ts   (selects strategy from level)
FIX   src/domain/__fixtures__/golden-scores.ts               (shared cross-repo cases)
```
> No new endpoint required — scoring is consumed internally by sync/leaderboard. (Optional:
> expose `POST /levels/:id/score` for contract testing if the Pact suite needs it.)

## TDD plan (🔴 → 🟢 → ♻️)

Follow PRD §7.5 exactly.

### Step 1 — Formula, timed (`puntuacion-mixta.spec.ts`)
- 🔴 `Puntaje == max(0, baseNivel − movimientos·Kmov + segundosRestantes·Ktiempo)` for a
  table of golden inputs.
- 🟢 Implement `PuntuacionMixta`.
- ♻️ Pull the `max(0, …)` floor into a shared helper.

### Step 2 — Formula, untimed (`puntuacion-por-movimientos.spec.ts`)
- 🔴 Time term dropped; floor at 0 verified (huge `movimientos` → `0`, **never negative**).
- 🟢 Implement `PuntuacionPorMovimientos`.
- ♻️ Share the floor helper.

### Step 3 — Strategy selection (`calcular-puntuacion.use-case.spec.ts`)
- 🔴 Timed level (`limiteTiempo` present) selects `PuntuacionMixta`; untimed selects
  `PuntuacionPorMovimientos`. Add a guard test asserting **no `PuntuacionPorTiempo`** symbol
  exists (negative/grep test).
- 🟢 Implement selection keyed off the level definition.
- ♻️ Inject strategies via a small factory/map; keep the use case ignorant of formulas.

### Step 4 — Stars boundaries (`calcular-puntuacion.use-case.spec.ts`)
- 🔴 For each of the three `umbralesEstrellas`, test **just below / at / above** the
  threshold → expected 1/2/3 stars (boundary tests).
- 🟢 Implement star thresholding.
- ♻️ Make the boundary inclusivity explicit and documented.

### Step 5 — Agreement (`golden-scores.spec.ts`)
- 🔴 Load the shared golden-score fixtures (same file shape the Dart repo consumes) and
  assert this implementation returns the recorded `{Puntaje, Estrellas}` for every case.
- 🟢 / ♻️ — fixtures become the cross-repo contract; CI fails on drift (PRD §7.5 agreement).

## Definition of Done
- Both strategies + selection + stars green; ≥ 90% coverage.
- `PuntuacionPorTiempo` confirmed absent (ubiquitous-language guard, ties into ticket 07).
- Golden-score fixtures committed for cross-repo agreement.
