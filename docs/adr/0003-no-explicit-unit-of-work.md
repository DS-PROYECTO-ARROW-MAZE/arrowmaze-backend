# No explicit Unit of Work; atomicity via Prisma nested writes and repository-scoped transactions

The frontend/backend diagram injects `IUnidadDeTrabajo` / `UnidadDeTrabajoPrisma` into
every write use case, but no MVP use case writes across two or more repositories
atomically: player registration, level create/update (one level + its cells via a single
nested write), and score submission are each single-aggregate. A generic Unit of Work
therefore adds no atomicity here, and the diagram's wiring — each repository holding its
own `PrismaService` with the UoW injected beside it — is the classic shape that runs repo
writes *outside* the transaction because Prisma's scoped `tx` client is never threaded
into the repositories. We **drop `IUnidadDeTrabajo`** rather than ship a no-op or
mis-wired abstraction.

## Consequences

- Single-aggregate atomicity comes from **Prisma nested writes** (free).
- The only batch case (offline progress sync) encapsulates `$transaction` **inside the
  repository adapter** (e.g. `RepositorioProgreso.guardarLote(...)`), behind the existing
  `IRepositorio…` port — the application layer still never names Prisma, so the Dependency
  Rule holds.
- This is a deliberate deviation from the diagram; a reader expecting a Unit of Work
  should find this ADR, not "fix" its absence.
- If a real cross-aggregate transaction ever appears, reintroduce a **correctly scoped**
  UoW (one that hands `tx`-bound repositories to the work) — the change is purely additive.
