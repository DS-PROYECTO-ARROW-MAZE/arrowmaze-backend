# Cross-cutting concerns: use-case Decorators (app layer) + NestJS interceptors (transport layer)

The rubric requires AOP demonstrated "via SOLID, without an AOP library," but the diagram
applied it two different ways for the *same* concern — metrics/logging as a hand-rolled
Decorator over use cases on the Flutter client, and as NestJS `«aspecto»` interceptors on
the server. We reconcile this by splitting cross-cutting concerns by **altitude** rather
than picking one mechanism everywhere.

- **Application-layer concerns → Decorator over use cases, identical on both repos.**
  `DecoradorCasoUso` (abstract) + `DecoradorMetricasCasoDeUso` / `DecoradorRegistroCasoDeUso`
  / `DecoradorSeguridadCasoDeUso` wrap `ICasoDeUso`. These are the rubric's "AOP via SOLID,
  no library" demonstration. The backend gains this stack to match the client (it previously
  only had interceptors).
- **Transport-layer concerns → NestJS interceptors at the HTTP boundary.** HTTP access
  logging, request correlation, global error→DTO mapping, and `InterceptorCacheRanking`
  (ADR-0002-era leaderboard cache) stay as interceptors — framework plumbing at the edge,
  explicitly *not* the AOP showcase.

## Consequences

- **The domain layer has none of this** — no decorators, no interceptors, no frameworks.
- **The use-case Decorators stay library-free by depending on ports, not concretes:**
  `IRegistro`, `IMedidorMetricas`, and `ProveedorSesion` (see ADR-0002) are interfaces; the
  real logging/metrics libraries live in infrastructure adapters injected in. A Decorator
  must never `import` a logging/metrics library directly — that would leak a framework into
  the application layer.
- Framework coupling (NestJS, RxJS, Prisma) is confined to the outer ring
  (interceptors + adapters), where it is expected.
- README states the two-tier rule explicitly so the split reads as a deliberate layering
  decision, not inconsistency.
