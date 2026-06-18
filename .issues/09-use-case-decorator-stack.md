# 09 — Use-case Decorator stack (Metricas / Registro / Seguridad)

**Phase:** 3 · **Story:** F1 (backend portion) · **Blocked by:** 01, 06

> The rubric's headline showcase: **"AOP via SOLID, no library"** (ADR-0004). A common
> `ICasoDeUso<E,S>` surface plus a `DecoradorCasoDeUso` abstract base and three concrete
> decorators add metrics, logging, and security **by composition** — depending only on
> **ports** (`IMedidorMetricas`, `IRegistro`, `ProveedorSesion`), with real libraries
> confined to infra adapters. Needs at least one real use case to wrap (01) and the
> `ProveedorSesion` port for the security decorator (06).

## User story

> **F1 — Events/cross-cutting drive reactions, not the domain.** The use case stays free
> of metrics/logging/security concerns; they are layered on by decorators (PRD §7.6).

## Deep modules touched

- **DM-B4** — `ICasoDeUso<E,S>.execute(E) → S`; `DecoradorCasoDeUso<E,S>` (abstract) +
  `DecoradorMetricas`, `DecoradorRegistro`, `DecoradorSeguridad`. Ports: `IMedidorMetricas`,
  `IRegistro` (real libs only in `RegistroConsola` / `MedidorMetricasSimple` adapters),
  `ProveedorSesion` (from ticket 06).

## Layers crossed

```
APP   src/application/ports/caso-de-uso.interface.ts            (ICasoDeUso<E,S>)
      src/application/decorators/decorador-caso-de-uso.ts        (abstract base)
      src/application/decorators/decorador-metricas.ts
      src/application/decorators/decorador-registro.ts
      src/application/decorators/decorador-seguridad.ts
      src/application/ports/{medidor-metricas.port.ts, registro.port.ts}
INFRA src/infrastructure/adapters/{metrics/medidor-metricas-simple.ts, logging/registro-consola.ts}
WIRE  modules: compose decorators around an existing use case (e.g. CrearNivelCasoDeUso)
```
> Refactor existing use cases (e.g. `CrearNivelCasoDeUso` from 01) to implement
> `ICasoDeUso<E,S>` so they can be wrapped without edits to their bodies.

## TDD plan (🔴 → 🟢 → ♻️)

Follow PRD §7.6.

### Step 1 — Transparent result (`decorador-caso-de-uso.spec.ts`)
- 🔴 A fake `ICasoDeUso` wrapped by all three decorators returns the **same result** as
  the bare use case (decorators are behaviour-preserving).
- 🟢 Implement the abstract base delegating `execute` to the wrapped instance.
- ♻️ Generics `<E,S>` so any use case composes.

### Step 2 — Metrics & logging (`decorador-metricas.spec.ts`, `decorador-registro.spec.ts`)
- 🔴 With spy ports: after `execute`, `IMedidorMetricas` recorded a timing/count and
  `IRegistro` logged start/finish. **Static-import assertion:** the decorator files import
  **no** logging/metrics library (only the ports) — dependency-direction check.
- 🟢 Implement both decorators against the ports.
- ♻️ Real libs live only in the infra adapters (`RegistroConsola`, `MedidorMetricasSimple`).

### Step 3 — Security (`decorador-seguridad.spec.ts`)
- 🔴 `DecoradorSeguridad` reads the session via the **injected `ProveedorSesion`** (never a
  static accessor — assert via fake); missing/invalid session → blocks `execute`
  (`NoAutorizadoException`); valid session → delegates through.
- 🟢 Implement against `ProveedorSesion` (ticket 06).
- ♻️ Confirm no static singleton access (supports ADR-0002).

### Step 4 — Composition wiring (`*.module` / integration)
- 🔴 An integration test resolves a wrapped use case from the Nest container and confirms
  the full stack (`Seguridad → Registro → Metricas → useCase`) executes in order.
- 🟢 Provide the composed instance via a factory provider.
- ♻️ Document the composition order.

## Definition of Done
- A use case gains metrics/logging/security **without any edit to its own logic**.
- Decorators import only ports — proven by static-import assertion (and ticket 07's guard).
- `DecoradorSeguridad` uses the injected session port exclusively.
