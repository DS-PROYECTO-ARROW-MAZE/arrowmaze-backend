# Backend is the authoritative solvability gate for level definitions

Because levels can be authored/served from the backend (the API exposes "obtener y
actualizar la definición de niveles" so clients can receive new levels without an app
update), an unsolvable level pushed server-side would soft-lock every player. We
therefore make solvability an **invariant of the `Nivel` aggregate / `DefinicionTablero`
value object**: `CrearNivelCasoDeUso` and `ActualizarNivelCasoDeUso` reject any board
that the greedy solvability check cannot empty, so the server can never persist or
serve a soft-lock. The client re-validates as defense-in-depth and is the *only* gate
for client-only boards produced by `GeneracionAleatoriaNivel`.

## Consequences

- The solvability algorithm exists in **two languages** (TypeScript backend, Dart
  client). Pact contract tests verify JSON shape, not solver agreement, so we keep a
  shared set of **golden boards** (solvable + unsolvable fixtures) that both repos' CI
  run their solver against, to catch algorithm drift.
- The check is greedy and polynomial (remove any arrow with a clear ray until empty;
  solvable iff the board empties — order-independent, no backtracking), so enforcing it
  on every create/update is cheap.
