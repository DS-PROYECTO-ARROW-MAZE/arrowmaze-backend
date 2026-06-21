# AI Usage Documentation

> Mandatory disclosure of AI use in this repository.
> **Project:** ArrowMaze Backend · **Last updated:** 2026-06-21

## 1. Tools Used

| Tool | Version / Model | Role in the team's workflow |
| ---- | --------------- | --------------------------- |
| Claude Code | Sonnet 4.6 (`claude-sonnet-4-6`) & Opus 4.8 (`claude-opus-4-8`) | Backend pair-programming, refactoring to hexagonal architecture, and authoring `.claude` skills |
| opencode (deepseek-v4) | `opencode/deepseek-v4-free` | Backend pair-programming implementing Tickets 01 and 03 (level creation + update with solvability gate) via TDD cycle |
| opencode (deepseek-v4-flash-free) | `opencode/deepseek-v4-flash-free` | Backend pair-programming implementing Ticket 05 (deterministic scoring and stars) plus architecture compliance analysis |

## 2. Usage Log by Task

### T-001 — Convert nestjs-patterns skill to hexagonal architecture

- **Task / problem addressed:** Update the `nestjs-patterns` skill so its documented folder structure follows hexagonal architecture (domain, application, infrastructure).
- **AI tool used:** Claude Code (Sonnet 4.6)
- **Prompt / instruction:** "update please @.claude/skills/nestjs-patterns/SKILL.md to use the folder structure of hexagonal architecture: domain, application and infraestructure" (verbatim)
- **Result obtained:** Rewrote the skill's *Project Structure*, *Modules/Controllers/Providers*, *DTOs and Validation*, and *Persistence* sections to a ports-and-adapters layout: pure `domain/` (entities, value objects, repository interfaces), `application/` (use cases, DTOs, mappers, ports), and `infrastructure/` (HTTP adapters, persistence adapters, config, NestJS module wiring), including a symbol-token repository injection example.
- **Modifications made by the team:** Accepted as generated; no manual edits applied after generation.
- **Lessons learned / limitations identified:** `.claude/skills/nestjs-patterns` is a symlink into `.agents/skills/`, so edits propagate to the real file there — useful to confirm symlink targets before editing.

### T-002 — Create the `ai-usage-doc` skill

- **Task / problem addressed:** Build an in-depth skill that generates and maintains a standardized `AI_USAGE.md` (tools used, per-task usage log, critical evaluation).
- **AI tool used:** Claude Code (Opus 4.8)
- **Prompt / instruction:** "i want to create an in depth skill that helps me to generate a markdown with this specifications: Mandatory Documentation of AI Use … Tools Used … Usage log by task … Critical evaluation …" (paraphrased — full requirement text supplied via the `/write-a-skill` command)
- **Result obtained:** Created `.claude/skills/ai-usage-doc/SKILL.md` (Create + Append workflows, rules, checklist) and `.claude/skills/ai-usage-doc/TEMPLATE.md` (exact output format). Design choices (template + guided fill, instructions-only, append-with-recalc) were confirmed via clarifying questions before writing.
- **Modifications made by the team:** Design driven by the team's answers to clarifying questions; no generated content was rejected.
- **Lessons learned / limitations identified:** A skill's `description` field drives activation, so trigger keywords must be explicit; structured clarifying questions up front avoided rework.

### T-003 — Generate the initial `AI_USAGE.md`

- **Task / problem addressed:** Produce the repository's mandatory AI usage documentation file.
- **AI tool used:** Claude Code (Opus 4.8)
- **Prompt / instruction:** "yes, generate the initial AI_USAGE.md" (verbatim)
- **Result obtained:** This file, populated from verifiable session activity; team-judgment fields left as marked drafts for confirmation.
- **Modifications made by the team:** <!-- DRAFT: confirm — record any edits the team makes after generation. -->
- **Lessons learned / limitations identified:** AI can faithfully log its own verifiable actions (prompts, file changes) but cannot author team-level judgments (percentages, reflections) without input.

### T-004 — Implement Ticket 01: Level authoring with the solvability gate

- **Task / problem addressed:** Build the full vertical slice for level creation: domain aggregate (`Nivel`), value objects (`DefinicionTablero`, `Celda`, `Direccion`, `Posicion`), solvability-gate service (`esSolvable` + `GrafoTablero`), use case (`CrearNivelCasoDeUso`), Prisma persistence (`Nivel` + `CeldaNivel` models, mapper, repository), HTTP controller (`POST /levels`), golden fixtures, and full test suite (unit, e2e).
- **AI tool used:** opencode (deepseek-v4-free)
- **Prompt / instruction:** "usa la skill tdd-strict e implementa el Ticket 01 — Level authoring with the solvability gate" (paraphrased) — followed by iterative prompts to create each layer (domain VOs, aggregate, solver, use case, controller, Prisma schema, mapper, repository, tests).
- **Result obtained:** Implemented ~20 source files across all three Clean Architecture rings plus tests and config. Key deliverables: `Nivel` aggregate with factory method, `DefinicionTablero` immutable VO, `esSolvable()` DFS-based solver enforcing ADR-0001, `CrearNivelCasoDeUso` with solvability invariant, `PrismaNivelRepository` adapter, `LevelsController` (POST /levels returns 201), golden boards in `shared/__fixtures__/`, and passing unit + e2e tests.
- **Modifications made by the team:** Two architectural violations were caught and corrected: (1) NestJS decorators/imports leaked into the application layer — removed and replaced with pure TypeScript dependency injection; (2) test fixture data was initially placed in the domain layer — moved to `shared/__fixtures__/golden-boards.ts` per AGENTS.md conventions.
- **Lessons learned / limitedness identified:** The AI tends to blur Clean Architecture boundaries, especially importing framework code (NestJS) into application use cases and placing test data in domain aggregates. The TDD cycle helps catch these early, but explicit layer-enforcement linting (per Ticket 07) would prevent them at write time.

### T-005 — Implement Ticket 03: Update level with solvability re-gate

- **Task / problem addressed:** Build `PUT /levels/:id` endpoint that re-validates solvability before persisting updates, preventing soft-locks on existing levels. Required: domain exception for 404, update use case with shared cell-mapping logic, upsert in Prisma repo, request DTO, 404 filter, controller wiring, and e2e tests.
- **AI tool used:** opencode (deepseek-v4-free)
- **Prompt / instruction:** "usa la skill tdd-strict e implementa el Ticket 03 — Update level with solvability re-gate siguiendo el mismo enfoque del Ticket 01. Arranca investigando el código existente RECIÉN creado para entender la base sobre la que vamos a construir." (verbatim) — followed by iterative prompts to implement each layer (RED test → GREEN implementation → REFACTOR shared logic).
- **Result obtained:** Implemented 6 new files and modified 6 existing files across all three Clean Architecture rings. Key deliverables: `ActualizarNivelCasoDeUso` (with shared `mapearCeldasDesdeDto` export), `NivelNoEncontradoException` (→404), `ActualizarNivelDto`/`ActualizarNivelResultadoDto`, `ActualizarNivelRequestDto` (class-validator), `NivelNoEncontradoFilter`, `NivelPrismaMapper.toUpdateArgs`, upsert logic in `PrismaNivelRepository.guardar`, and `PUT /levels/:id` endpoint. 28 unit + 8 e2e tests all pass. Refactored `CrearNivelCasoDeUso` to reuse `mapearCeldasDesdeDto`, eliminating inline duplication.
- **Modifications made by the team:** The architecture post-analysis identified that `mapearCeldasDesdeDto` was placed inside `actualizar-nivel.use-case.ts` and imported by `crear-nivel.use-case.ts`, creating a cross-use-case coupling. Originally accepted as part of the ticket, it was flagged for extraction to a shared utility in a follow-up refactor.
- **Lessons learned / limitations identified:** The AI's tendency to co-locate shared helper functions inside a use case file (rather than extracting to a shared module) creates hidden coupling between vertical slices. This pattern recognition should be automated in linting or explicitly mentioned in the AGENTS.md conventions. The upsert-via-existence-check pattern (findUnique → create/update) works correctly but is a code smell — a single `nivel.upsert()` with a proper `where` clause would be simpler and avoid the extra query.

### T-006 — Implement Ticket 05: Deterministic scoring and stars

- **Task / problem addressed:** Build the deterministic score formula for the ArrowMaze game: `PuntuacionMixta` for timed levels (movements + time bonus), `PuntuacionPorMovimientos` for untimed (movements only), strategy selection via runtime check on `limiteTiempo`, stars rating (1–3) from score thresholds, golden-score fixtures shared with the Dart frontend for cross-repo agreement, and ubiquitous-language guards (`PuntuacionPorTiempo` must not exist).
- **AI tool used:** opencode (deepseek-v4-flash-free)
- **Prompt / instruction:** (1) "Lee el fichero .issues/05-deterministic-scoring-and-stars.md. Luego explora el código existente para entender el estado actual del proyecto. Al finalizar, dime cuál es el plan de implementación detallado, paso a paso, indicando qué ficheros crearemos y modificaremos." (verbatim) — (2) "Muy bien, comencemos con el TDD. Crea los tests primero." (verbatim) — (3) "Ahora necesito que usando la información de la AGENTS.md y tus skills hagas una verificación completa de calidad" (verbatim) — (4) "Analiza el ArrowMaze Backend y verifica que se cumpla la regla de dependencia de arquitectura hexagonal y los principios de DDD." (verbatim) — (5) "Usa la skill 'ai-usage-doc' para documentar en el AI_USAGE.md todo el trabajo, los prompts y el resultado de este ticket." (verbatim)
- **Result obtained:** Implemented 11 new files across all three Clean Architecture rings via strict TDD (Red-Green-Refactor). Key deliverables: `EstrategiaPuntuacion` interface (strategy contract), `PuntuacionMixta` (score = max(0, base − mov·Kmov + segundosRestantes·Ktiempo)), `PuntuacionPorMovimientos` (score = max(0, base − mov·Kmov)), `puntajeConSuelo()` utility, `ResultadoPuntaje` VO with `puntaje + estrellas`, `CalcularPuntuacionCasoDeUso` with strategy selector via `Map<'mixta'|'porMovimientos', EstrategiaPuntuacion>` and stars calculator (3→2→1 star thresholds), 9 golden-score fixtures in `shared/__fixtures__/golden-scores.ts` with agreement test, and ubiquitous-language guard test asserting `PuntuacionPorTiempo` class does not exist. All 62 tests pass (10 suites) with 100% coverage on new code.
- **Modifications made by the team:** Removed unused `umbral3` parameter from `CalcularPuntuacionCasoDeUso.calcularEstrellas()` after lint flagged it (`@typescript-eslint/no-unused-vars`). Skipped wiring `CalcularPuntuacionCasoDeUso` in NestJS module per ticket guidance ("no new endpoint required — scoring is consumed internally by sync/leaderboard"). The architecture analysis after implementation confirmed zero dependency violations across all layers.
- **Lessons learned / limitations identified:** The TDD cycle with AI successfully generated the strategy pattern implementation with no architectural violations — a marked improvement over T-004 where NestJS imports leaked into the application layer. The unused parameter (`umbral3`) was caught by lint, not by tests, reinforcing that automated lint verification is essential post-generation. The architecture analysis revealed an anemic domain model (no invariant validation in `Nivel`) which is a DDD smell for a future ticket to address.

### T-007 — Implement Ticket 02: Harden registration (bcrypt + domain exception)

- **Task / problem addressed:** Upgrade the already-shipped `POST /auth/register` tracer bullet from "works on the happy path" to "production-honest" per `.issues/02-harden-registration-bcrypt.md`: hash passwords with bcrypt behind a port so the application/domain layers never import `bcrypt` directly, and replace the generic `Error` thrown on a duplicate email with a typed domain exception mapped to `409 Conflict`.
- **AI tool used:** Claude Code (Sonnet 4.6)
- **Prompt / instruction:** "Use the `tdd-strict` skill and implement Ticket 02 — Harden registration (bcrypt + domain exception), following the same red-green-refactor approach as the previous tickets." (paraphrased — exact transcript from that session not preserved)
- **Result obtained:** Added `IHashContrasena` port (`application/ports/hash-contrasena.port.ts`), `BcryptHashAdapter` as the sole `bcrypt` import site with config-driven salt rounds, `EmailYaRegistradoException` (domain) and `EmailYaRegistradoExceptionFilter` mapping it to 409, rewired `RegisterUserUseCase` to inject both ports via DI tokens and throw the domain exception instead of `new Error(...)`, `AuthController` + `AuthModule` wiring, and unit + e2e coverage (`register-user.use-case.spec.ts`, `bcrypt-hash.adapter.spec.ts`, `test/auth.e2e-spec.ts`) asserting: duplicate email → 409 with no extra row written, the stored password never equals the plaintext, and the use case's own source contains no `bcrypt` reference. The same session also recreated four supporting files that had been deleted in an earlier "purge boilerplate" commit (`c6bd26e`) — `User` entity, `RegisterUserDto`, `IUserRepository`, `UserPrismaMapper` — which the use case needs to compile.
- **Modifications made by the team:** <!-- DRAFT: confirm — no manual corrections were identifiable from re-reading the diff after the fact; please confirm or add any you recall from that session. -->
- **Lessons learned / limitations identified:** (1) The four recreated supporting files were left untracked while the bcrypt commit (`f3e7078`) that depends on them was already committed — anyone checking out that commit alone gets a non-compiling tree; a commit that introduces a dependency should include the files it depends on. (2) The "use case must not import bcrypt" invariant is tested by `fs.readFileSync`-ing the use case's own `.ts` file and regex-matching for `/bcrypt/i` — a clever but brittle white-box test that breaks on file rename and would miss an indirect import; an architecture-boundary lint rule (Ticket 07) would enforce this more robustly than a text-grep test.

## 3. Critical Evaluation

### AI-assisted code share

- **Approximate % of code that was AI-assisted:** ~89% (cumulative across all tickets)
- **Basis for the estimate:** ~48 total `.ts` files in the project as of T-006 (~41/48 ≈ 85%). T-007 (Ticket 02) adds 10 new files in commit `f3e7078` (port, exception, adapter + spec, controller, filter, module, use-case spec, e2e spec) plus 4 recreated supporting files from the same session (entity, DTO, repository interface, mapper), all AI-generated → ~55/62 ≈ 89%. <!-- DRAFT: confirm — recomputed from file counts, not a team-reviewed figure. -->

### Incorrect or suboptimal AI results

- **Case:** NestJS decorators and imports (`@Injectable`, `@Inject`, `@nestjs/common`) were placed inside `CrearNivelCasoDeUso` in the application layer, violating the Clean Architecture dependency rule (application must not import framework code).
  - **How it was detected:** Code review by the team flagged the `@nestjs/common` import.
  - **How it was corrected:** Replaced with plain class + constructor injection; NestJS injection wiring moved to the infrastructure module.

- **Case:** Solvable/unsolvable board fixture data was written inline inside `nivel.spec.ts` instead of in the shared golden-fixtures module, making it impossible for the frontend (Dart) to reference the same boards for solver agreement testing.
  - **How it was detected:** Code review — team noticed the boards were not in `shared/__fixtures__/`.
  - **How it was corrected:** Moved board definitions to `src/shared/__fixtures__/golden-boards.ts` and imported them from tests.

- **Case (T-005):** The shared helper `mapearCeldasDesdeDto` was placed inside `actualizar-nivel.use-case.ts` and imported by `crear-nivel.use-case.ts`, coupling two independent vertical slices. A utility function should live in a shared location, not inside a use case.
  - **How it was detected:** Architecture analysis post-implementation flagged the cross-use-case dependency.
  - **How it was corrected:** Flagged for refactoring to `src/application/utils/mapear-celdas.ts` — not yet applied.

- **Case (T-006):** The unused `umbral3` parameter was included in `CalcularPuntuacionCasoDeUso.calcularEstrellas()`. The method only needs `umbral1` and `umbral2` (3-star and 2-star thresholds) since 1 star is the implicit floor. The extra parameter was dead code.
  - **How it was detected:** ESLint `@typescript-eslint/no-unused-vars` flagged it on `npm run lint`.
  - **How it was corrected:** Removed `umbral3` from the `calcularEstrellas` signature and its call site.

- **Case (T-007):** The commit implementing bcrypt hashing (`f3e7078`) depends on four files (`User` entity, `RegisterUserDto`, `IUserRepository`, `UserPrismaMapper`) that had been deleted by an earlier "purge boilerplate" commit (`c6bd26e`) and were recreated in the same AI session but never staged — leaving the bcrypt commit's dependencies untracked.
  - **How it was detected:** `git status` on the branch showed the four files as untracked while the commit that imports them was already in history.
  - **How it was corrected:** Not yet corrected — flagged here pending the team staging and committing these four files.

- **Case (T-007):** The "use case must not import `bcrypt`" invariant (an explicit Definition-of-Done item in Ticket 02) was tested by having `register-user.use-case.spec.ts` read its own source file with `fs.readFileSync` and regex-match for `/bcrypt/i`, rather than via a structural/import-boundary check.
  - **How it was detected:** Code review while drafting this AI usage entry.
  - **How it was corrected:** Not yet refactored — flagged for replacement with an architecture-boundary lint rule (Ticket 07) instead of a text-grep test, which is brittle to file renames and blind to indirect imports.

### Team reflection

- **Impact on productivity:** Tickets 01 and 03 were each implemented in single sessions with all layers (domain → application → infrastructure → tests) generated by AI, each would have taken several days manually. The reuse pattern (shared `mapearCeldasDesdeDto`) eliminated duplicated mapping code between create and update use cases in minutes.
- **Impact on code quality:** High for boilerplate (VOs, DTOs, mappers, repository adapters) and for enforcing the solvability invariant across both create and update paths — no divergence between the two gates. However, the AI co-locates shared helpers inside use-case files rather than extracting them to shared modules, and the upsert-via-existence-check pattern introduces an extra query. Both are design smells that require human oversight.
- **Overall takeaways:** AI is excellent for rapidly scaffolding full vertical slices including the second slice that mirrors the first. Layer-enforcement linting (Ticket 07) and a stronger shared-utility extraction convention in AGENTS.md would catch the cross-use-case coupling pattern at write time. The TDD + AI codegen + human architecture review workflow remains effective — the architecture review (hexagonal + DDD compliance check) after implementation caught the coupling issue that pure testing did not. T-007 reinforces the same point from a different angle: the port/adapter pattern for `bcrypt` and the domain-exception-to-HTTP-status mapping were both applied cleanly and consistently with prior tickets, but recreating previously-purged files within a feature commit — without staging them — shows that AI sessions need an explicit "is the tree self-consistent" check (e.g. a clean-clone build) before a ticket is considered done.
