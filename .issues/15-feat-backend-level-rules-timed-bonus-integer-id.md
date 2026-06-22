# feat(backend): level rules — integer ids, timed levels ≥10, bonus-level scoring/time exemption

**Phase:** 5 (enhancement) · **Story:** C3 / D2 (extension) · **Blocked by:** 01, 05
**Cross-repo twin:** `arrowmaze-frontend` ticket 18 (timer rules) + ticket 17 (catalog).

> Three product rules about *what a level is* are encoded here, in the level definition and
> its validation — not scattered across callers:
>
> 1. **Integer level identifier.** Beyond the storage `uuid`, every level carries an
>    ordinal integer (`numero`: 1, 2, 3 …) that defines play order and gates the rules below.
> 2. **Time limit by ordinal.** A `limiteTiempo` is **required** for levels `numero ≥ 10`
>    and **forbidden** for levels `1–9` (those are untimed).
> 3. **Bonus levels.** A level may be flagged `esBonus`. On a bonus level **time and score
>    do not apply** — no timer, no `Puntaje`/`Estrellas` are computed or persisted.

## User story

> **C3‴ — Author a level whose rules match its ordinal/type.** *As Ops, the system stops me
> from publishing a timed level 3, an untimed level 12, or a scored bonus level.*
>
> - **Given** `numero = 12` with no `limiteTiempo` → **rejected**.
> - **Given** `numero = 4` with a `limiteTiempo` → **rejected**.
> - **Given** `esBonus = true` → scoring/time fields are ignored and the level is marked
>   non-scoring; `CalcularPuntuacionUseCase` is never invoked for it.

## Deep modules touched

- **DM-B1** — `Nivel` aggregate / `DefinicionNivel` gains `numero: int` and `esBonus: bool`;
  the timed-vs-ordinal and bonus invariants are enforced **in construction**.
- **DM-B2** — `CrearNivelCasoDeUso` validation surfaces the new rule violations as domain
  exceptions.
- **scoring (ticket 05)** — strategy selection learns a **third path**: bonus → *no scoring*
  (returns a sentinel "no puntuable" result; not a new `PuntuacionPorTiempo`).
- **DM-B6** — DTOs carry `numero`, `esBonus`.

## Layers crossed

```
DOM   src/domain/aggregates/nivel.ts                       (+ numero, esBonus + invariants)
      src/domain/value-objects/definicion-nivel.ts
      src/domain/exceptions/regla-tiempo-nivel.exception.ts        (NEW)
      src/domain/services/scoring/calcular-puntuacion.use-case.ts  (bonus ⇒ no score path)
DTO   src/application/dtos/crear-nivel.dto.ts              (+ numero, esBonus)
DB    prisma/schema.prisma   (+ numero Int @unique, + esBonus Boolean; + migration)
```

## Rule table (single source of truth — mirror in PRD §3)

| `numero` | `esBonus` | `limiteTiempo` | Timer | Scoring |
|---|---|---|---|---|
| 1–9 | false | **forbidden** | none | yes |
| ≥10 | false | **required** | yes | yes |
| any | true | ignored | none | **no** |

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Ordinal/timer invariant (`definicion-nivel.spec.ts`)
- 🔴 `numero ≥ 10` without `limiteTiempo` throws `ReglaTiempoNivelException`; `numero 1–9`
  *with* `limiteTiempo` throws; boundary at **exactly 10** is timed, **9** is untimed.
- 🟢 Enforce in construction.
- ♻️ Express the threshold (`PRIMER_NIVEL_CRONOMETRADO = 10`) as a named constant.

### Step 2 — Bonus exemption (`calcular-puntuacion.use-case.spec.ts`)
- 🔴 For `esBonus = true`, the use case returns a **non-scoring** result and never applies
  the time/move formula or star thresholds; assert no `Puntaje`/`Estrellas` produced.
- 🟢 Add the bonus branch to strategy selection (data-driven off `esBonus`, not a subtype).
- ♻️ Confirm the avoid-listed `PuntuacionPorTiempo` is still absent (ticket 07 guard).

### Step 3 — Create e2e (`test/levels.e2e-spec.ts`)
- 🔴 The three rejection cases above → `422`; a valid timed level 10 and a valid bonus
  level → `201` with the flags persisted (`numero` unique).
- 🟢 Wire DTO/mapper/migration.
- ♻️ Map the new exception to the HTTP error DTO.

## Definition of Done
- Timed-by-ordinal and bonus invariants enforced in the domain (boundary-tested at 9/10).
- Bonus levels are provably non-scoring (scoring use case not invoked).
- `numero` persisted and unique; rule table documented in PRD §3.
