# Canonical progress-sync contract: `segundosRestantes`, server-recomputed score, loud 400 on drift

`POST /progress/sync` and the Flutter client were authored independently (backend Ticket 08,
frontend Ticket 14) and drifted apart. The client posted each run as
`{ nivelId, estrellas, movimientos, tiempoSegundos, completadoEn }`, but the backend whitelists
`{ nivelId, movimientos, segundosRestantes?, completadoEn }` and runs the global
`ValidationPipe` with `forbidNonWhitelisted: true`. Two client fields are therefore unknown —
`tiempoSegundos` (elapsed time) and `estrellas` (a client-claimed star count) — so **the whole
batch is rejected with `400` before any row is written**. The only `progresos` rows in Supabase
were the ones inserted by hand via Postman; real gameplay never landed, and the leaderboard
projection (which reads `progresos`) was consequently empty of gameplay (Ticket 12 symptom).

We pick **one** canonical contract and make both repos speak it:

- **Time is `segundosRestantes`** — seconds *remaining* on the clock, not elapsed. This is the
  term the whole backend already speaks: the `Progreso` model/column, the leaderboard
  projection (`ConsultaRankingPrisma`), and the scoring formula (§05, `PuntuacionMixta` adds
  `segundosRestantes * ktiempo`). The **client** converts its elapsed `tiempoSegundos` to
  `segundosRestantes = limiteTiempo - tiempoSegundos` before sending (frontend Ticket 15); it
  already holds `limiteTiempo` from the level catalog. Remaining and elapsed are *different
  quantities*, so a blind rename would corrupt every timed-level score — the conversion is the
  point, and it belongs where the timer lives.
- **The contract carries no score.** `puntaje`/`estrellas` are not on the wire DTO at all; the
  server recomputes them via `CalcularPuntuacionCasoDeUso` (Ticket 05/17), so a client cannot
  assert a score even if it tries.
- **Unknown fields are a loud `400`, never a silent drop.** We keep
  `forbidNonWhitelisted: true`. A run that still carries `tiempoSegundos`/`estrellas` fails
  visibly rather than persisting with a dropped field — a silent strip is exactly how this
  regression hid (a 4xx at least surfaces in the client's logs).

## Consequences

- The backend needed **no change to the sync field names** — its DTO was already canonical.
  The regression is fixed on the client side (the cross-repo twin, frontend Ticket 15), and the
  backend's job is to *prove and lock* the contract: `test/progress.e2e-spec.ts` now asserts the
  canonical batch persists with the server-recomputed score, that the legacy
  `tiempoSegundos`/`estrellas` shape is rejected `400` with **zero** rows written, and that
  synced rows then surface through the real (un-mocked) leaderboard projection ordered by
  `puntaje`. That e2e is this slice's contract test (there is no Pact harness in the repo).
- Both repos must change **together**: until frontend Ticket 15 ships the conversion, the live
  client still 400s. That is the intended, *visible* failure mode — not a silent data-loss one.
- If a future client genuinely needs to report elapsed time, the conversion stays client-side
  (or a new explicitly-named edge field is added and mapped), never an ambiguous reuse of
  `segundosRestantes` to mean elapsed.
