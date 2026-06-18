# 10 — Backend domain-events publisher

**Phase:** 3 · **Story:** E1 (player-registered side effect) · **Blocked by:** 02

> The backend's **own** event publisher — explicitly **distinct** from the frontend
> `PublicadorEventosJuego` (PRD §6.2 DM-B7: "keep both"). Registration emits a
> *player registered* domain event through `IPublicadorEventos`; the dispatch/transport is
> hidden behind the port. Builds on the registration slice (02).

## User story

> **E1 — Register** (event facet). When a `User` is registered, the aggregate records a
> domain event that is published via `IPublicadorEventos`, without the use case knowing the
> transport.

## Deep modules touched

- **DM-B7** — `IPublicadorEventos` (`src/domain/events`) + messaging adapter
  (`src/infrastructure/adapters/messaging`). Reuses the `AggregateRoot`/`DomainEvent`
  stereotypes already in `src/domain/stereotypes`.

## Layers crossed

```
DOM   src/domain/events/publicador-eventos.interface.ts        (IPublicadorEventos + token)
      src/domain/events/jugador-registrado.event.ts            (extends DomainEvent)
      src/domain/aggregates/jugador.ts  (or extend User → AggregateRoot to record the event)
APP   src/application/use-cases/register-user.use-case.ts       (publish recorded events after save)
INFRA src/infrastructure/adapters/messaging/publicador-eventos.adapter.ts
WIRE  src/infrastructure/modules/auth.module.ts                (bind port → adapter)
```

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Aggregate records the event (`jugador.spec.ts`)
- 🔴 Creating a registered player records exactly one `JugadorRegistradoEvent` in
  `domainEvents` (carrying id + email, no password); `clearEvents()` empties it.
- 🟢 Use the existing `AggregateRoot.addDomainEvent` stereotype.
- ♻️ Keep the event a pure value object (a record of what happened, not a command — PRD §4).

### Step 2 — Use case publishes (`register-user.use-case.spec.ts`, extend ticket 02)
- 🔴 After a successful `save`, the use case calls `IPublicadorEventos.publicar` with the
  recorded event(s) **and then clears them**; on the duplicate-email path it publishes
  **nothing** (assert spy not called).
- 🟢 Inject the port, drain `domainEvents` after persistence.
- ♻️ Publish after the write commits (no event for a failed registration).

### Step 3 — Adapter (`publicador-eventos.adapter.spec.ts`)
- 🔴 `publicar(events)` dispatches each to the configured transport (spy/in-memory bus for
  the test); ordering preserved.
- 🟢 Implement the messaging adapter.
- ♻️ Keep transport details out of the domain/application layers.

## Definition of Done
- Registration emits `JugadorRegistradoEvent` via the port; nothing emitted on failure.
- Backend publisher is clearly separate from the frontend one (naming + location).
- Domain stays framework-free (ticket 07 guard).
