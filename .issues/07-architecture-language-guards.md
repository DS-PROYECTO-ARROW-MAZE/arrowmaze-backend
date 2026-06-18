# 07 — Architecture & ubiquitous-language guard tests

**Phase:** 2 · **Story:** §7.8 · **Blocked by:** 01

> Automated rails that keep every later ticket honest: the **domain layer imports no
> framework** (ADR-0004) and the **avoid-list vocabulary never reappears** (PRD §4).
> These are executable tests in CI, not review folklore. Depends on 01 only so there is a
> real domain to scan.

## User story

> **§7.8 — Contract & architecture guards.**
> - **Domain purity:** automated check that `domain` imports no Flutter/Nest/Prisma/
>   logging/metrics symbols (ADR-0004).
> - **Ubiquitous-language guard:** lint/test forbids avoid-list identifiers (`CeldaSalida`,
>   `*Decorator` cells, `Composite`, `NivelFacil/Medio/Dificil`, `PuntuacionPorTiempo`,
>   plural `CargadorNiveles`).

## Deep modules touched

- Cross-cutting — no production module; pure test/lint infrastructure guarding all DM-B*.

## Layers crossed

```
TEST  src/__arch__/domain-purity.spec.ts          (scans src/domain/**)
      src/__arch__/ubiquitous-language.spec.ts     (scans src/**)
      src/__arch__/application-no-prisma.spec.ts    (scans src/application/**)
LINT  eslint.config.mjs                            (optional: no-restricted-imports for domain)
```

## TDD plan (🔴 → 🟢 → ♻️)

These tests are written to **fail loudly the moment a violation is introduced**; the
"green" state is the clean current tree.

### Step 1 — Domain purity (`domain-purity.spec.ts`)
- 🔴 Write a test that reads every `.ts` under `src/domain` and asserts none import
  `@nestjs/*`, `@prisma/client`, `bcrypt`, or any logging/metrics lib. Temporarily add a
  bad import to a scratch file to watch it fail, then remove it.
- 🟢 Implement the scanner (read files, regex import statements, fail on match).
- ♻️ Externalise the forbidden-prefix list to a shared const reused by the lint rule.

### Step 2 — Application ≠ Prisma (`application-no-prisma.spec.ts`)
- 🔴 Assert no file under `src/application` imports `@prisma/client` or `PrismaService`
  (PRD §7.7: "Application layer never imports Prisma").
- 🟢 Implement scanner.
- ♻️ Reuse the scanner utility from Step 1.

### Step 3 — Ubiquitous-language guard (`ubiquitous-language.spec.ts`)
- 🔴 Assert the avoid-list identifiers never appear as symbols anywhere in `src`:
  `CeldaSalida`, cell `*Decorator`/`Composite`, `NivelFacil`/`NivelMedio`/`NivelDificil`,
  `PuntuacionPorTiempo`, plural `CargadorNiveles`. (Exclude this spec's own list literal.)
- 🟢 Implement the scanner.
- ♻️ Document each banned term with the PRD §4 / §9 rationale in code comments.

### Step 4 — ESLint reinforcement (optional but preferred)
- 🟢 Add `no-restricted-imports` for `src/domain` and a `no-restricted-syntax` /
  `id-denylist` for the vocabulary, so violations also surface in `npm run lint`.

## Definition of Done
- All three guard specs green on the current tree and demonstrably red when a violation is
  planted (include a short note in the PR showing the failing run).
- Guards run as part of `npm test` so every later ticket inherits the rails.
