# One showcase Singleton; session access via an injected port

The rubric requires the GoF **Singleton** pattern *and* the **Dependency Rule** plus
non-fragile tests — goals that collide when use cases reach for static `instancia()`
globals. The frontend diagram marks three classes `«Singleton»` (`ConfiguracionManager`,
`SesionManager`, `AudioServiceImp`), each with a static accessor. We deliberately deviate
from the diagram: **`AudioServiceImp` is the single honest GoF Singleton** (private
constructor + static accessor) — a leaf infrastructure concern the domain never reasons
about, so a global there does no architectural harm and is easy to point to as the
required pattern. Every other "singleton" becomes a *lifetime* decision supplied by the
DI container (`Inyector`), not a static global: classes the domain/application layers
depend on are reached through **injected interfaces**.

## Consequences

- **`SesionManager` is replaced by an injected `ProveedorSesion` port.** It holds the auth
  `_token`, so it was the global most likely to be grabbed by security-sensitive code;
  `DecoradorSeguridadUseCase` reads the session through the injected port, never a static
  accessor. This keeps the Dependency Rule intact and lets tests substitute a fake session
  without mutable global state leaking between cases.
- **`ConfiguracionManager` keeps singleton *lifetime* but loses static access** — it is
  injected, so its ownership of `_cargador: CargadorNiveles` no longer hard-couples callers
  to a global (see the level-loader port decision).
- The diagram shows three `«Singleton»` boxes; the code has one. The deviation is
  intentional and must be defended as such, not "fixed" back to three static globals.
