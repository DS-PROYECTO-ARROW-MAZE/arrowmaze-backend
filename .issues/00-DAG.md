# ArrowMaze Backend — Tracer-Bullet Delivery DAG

> Scope: **`arrowmaze-backend` only** (Nest.js + Prisma, Clean Architecture
> `domain ← application ← infrastructure`). Frontend deep modules (DM-F*) are out of
> scope here; the cross-repo *agreement* obligations they impose (solver verdicts,
> scoring numbers) are honoured on this side via shared **golden fixtures**.
>
> Each ticket is a **vertical slice**: it cuts through HTTP transport → application
> use case → domain → persistence so it produces working, demoable behaviour the day
> it merges. No horizontal "build all of the domain first" tickets.

## Already shipped (Phase 0)

- **E1 (basic)** — `POST /auth/register` exists (`RegisterUserUseCase`,
  `PrismaUserRepository`, `User` entity). It is the *unhardened* first tracer bullet:
  no password hashing, generic `Error` on duplicate. Ticket **02** hardens it.

## The graph

```
                          ┌──────────────────────────── PHASE 1 (foundation, start here) ───────────────────────────┐
                          │                                                                                          │
                  ┌───────┴────────┐                                                              ┌──────────────────┴───┐
                  │ 01 Level + gate │ (keystone: domain primitives + Solver + Nivel agg + persist) │ 02 Harden register   │
                  │  C3-create      │                                                              │  (bcrypt) E1          │
                  └───────┬─────────┘                                                              └─────────┬────────────┘
                          │                                                                                  │
   ┌──────────┬──────────┼───────────┬────────────────────┐                          ┌─────────────────────┴─────────┐
   ▼          ▼          ▼           ▼                    ▼                          ▼                               ▼
┌────────┐ ┌────────┐ ┌─────────┐ ┌────────────┐   ┌──────────────┐         ┌──────────────────┐        (re-used by 09)
│03 Update│ │04 Serve│ │05 Score │ │07 Arch     │   │ (decorator   │         │ 06 Login + JWT   │
│ level   │ │ level  │ │ & stars │ │ guards     │   │  needs 01)   │         │  + ProveedorSes. │
│ C3-upd  │ │ C2     │ │ D1–D3   │ │ §7.8       │   └──────┬───────┘         └────────┬─────────┘
└────────┘ └────────┘ └────┬────┘ └────────────┘          │                          │
   (Phase 2 — all parallel after their parent)             │                          │
                          ┌──────────────────────┬─────────┘                          │
                          ▼                       ▼                                    ▼
                   ┌─────────────┐        ┌──────────────────┐                ┌──────────────────┐
                   │08 Progress  │        │09 Decorator stack│◄───────────────┤ (security decor.  │
                   │ sync batch  │        │ Metr/Reg/Seg     │   needs        │  reads Proveedor) │
                   │ E2  (←01,05)│        │ DM-B4 (←01,06)   │   ProveedorSes │                  │
                   └──────┬──────┘        └──────────────────┘                └──────────────────┘
                          │                       (Phase 3)
                          ▼
                   ┌──────────────────┐    ┌──────────────────────────┐
                   │10 Events publish │    │11 Leaderboard + cache    │
                   │ DM-B7 (←02)      │    │ DM-B5  E3   (←08)         │
                   └──────────────────┘    └──────────────────────────┘
                        (Phase 3)                  (Phase 4)
```

## Strict blocking dependencies

| # | Ticket | Story | Deep modules | Blocked by | Phase |
|---|--------|-------|--------------|------------|-------|
| 01 | Level authoring + solvability gate | C3 (create) | DM-B1, DM-B2, DM-B3, DM-B6 | — (existing scaffold only) | **1** |
| 02 | Harden registration (bcrypt + domain exception) | E1 | DM-B2, DM-B3 | — (existing `register`) | **1** |
| 03 | Update level (re-gated) | C3 (update) | DM-B1, DM-B2, DM-B3 | 01 | **2** |
| 04 | Serve level by id (re-validate before serve) | C2 | DM-B1, DM-B3, DM-B6 | 01 | **2** |
| 05 | Deterministic scoring & stars | D1, D2, D3 | scoring (TS mirror of DM-F6) | 01 | **2** |
| 06 | Login + JWT guard + `ProveedorSesion` port | NFR security / DM-B6 | DM-B6, security | 02 | **2** |
| 07 | Architecture & language guard tests | §7.8 | (cross-cutting) | 01 | **2** |
| 08 | Progress sync batch (`$transaction`) | E2 | DM-B3 | 01, 05 | **3** |
| 09 | Use-case Decorator stack | F1 (backend) | DM-B4 | 01, 06 | **3** |
| 10 | Backend domain-events publisher | E1 (player-registered) | DM-B7 | 02 | **3** |
| 11 | Leaderboard read projection + TTL cache | E3 | DM-B5, DM-B6 | 08 | **4** |

### Critical path
`01 → 05 → 08 → 11` (level rules → scoring agreement → durable progress → projection).

### Maximum parallelism
- After **01 + 02** land: **03, 04, 05, 06, 07** can all be grabbed simultaneously.
- After **05**: **08** opens. After **06**: **09** opens. After **02**: **10** opens.
- **11** is the only Phase-4 item (needs persisted `Progreso` rows from **08**).

## Working agreement (all tickets)

- **TDD is mandatory** (PRD §7): write the failing test first (🔴), make it pass with the
  smallest change (🟢), then refactor (♻️). Tests target **deep-module interfaces**, not
  internals, so refactors don't break suites.
- Tests are colocated `*.spec.ts` (Jest, `rootDir: src`). e2e in `test/` via `jest-e2e.json`.
- **Domain layer imports no framework** (ADR-0004): no `@nestjs/*`, no `@prisma/client`,
  no logging/metrics libs in `src/domain`. Ticket **07** enforces this automatically.
- Use the **ubiquitous language** verbatim (PRD §4). The avoid-list (`CeldaSalida`,
  `PuntuacionPorTiempo`, `NivelFacil/Medio/Dificil`, plural `CargadorNiveles`, cell
  decorators/Composite) is forbidden and linted in **07**.
- Coverage gate: domain + application ≥ **90%** lines (PRD §1.4 / §7).

## Phase 5 — Enhancement batch (tickets 12–17)

> Added after the MVP graph above. Ticket **12 is Priority 1** (hotfix) and should be grabbed
> first. Cross-repo twins live in `arrowmaze-frontend` (tickets 15–21). Diagram deltas are
> planned in `DIAGRAM-RECONCILIATION.md §10`.

| # | Ticket | Story | Blocked by | Phase | Priority |
|---|--------|-------|------------|-------|----------|
| 12 | Restore gameplay→Supabase progress sync & leaderboard visibility | E2/E3 (regression) | 08, 11 | Hotfix | **1** |
| 13 | High-score persistence (strictly-higher upsert) | E2′ | 08, 12 | 5 | — |
| 14 | Dynamic board geometry + arrow-length-≥2 invariant | C3″ | 01 | 5 | — |
| 15 | Level rules — integer ids, timed ≥10, bonus exemption | C3‴ | 01, 05 | 5 | — |
| 16 | Seed & serve 15+ ordered levels (catalog) | C2′ | 04, 14, 15 | 5 | — |
| 17 | Proportional star rating from final score | D3′ | 05, 15 | 5 | — |

- **Grab first:** 12 (P1). After 12 → 13. 14 and 15 open off 01/05 in parallel. 16 needs 14+15.
  17 needs 05+15.
- **Cross-repo agreement:** 14 (shaped golden boards), 16 (`PerfilDificultad`), 17 (golden
  scores) must stay in lockstep with their frontend twins.

## Phase 6 — Enhancement batch 2 (ticket 18)

> Added 2026-06-24 from the second requirements batch (PRD §12). Most of batch 2 is frontend
> (tickets 22–30); the backend's share is the **read path** for progress restore + high-score.

| # | Ticket | Story | Blocked by | Phase | Priority |
|---|--------|-------|------------|-------|----------|
| 18 | `GET /progress` restore endpoint + high-score read guarantee | E4 / E2′ | 08, 11, 13 | 6 | **1** (twin of FE 24) |

- **Grab first:** 18 (P1) — pairs with `arrowmaze-frontend` ticket 24; share one contract.
- **Scope:** read-only, JWT-guarded endpoint returning **best-per-level** (one row per level,
  guaranteed by ticket 13's `@@unique`). Validates the high-score rule from the read side; does
  **not** re-implement the strictly-greater upsert (that stays in ticket 13).

## Phase 7 — Enhancement batch 3 (ticket 19)

> Added 2026-07-13. Adds a depth axis ("capa"/z) to the board — the 3D board the PRD (§1.1,
> §6.1, §8) has flagged as the target OCP extension since inception. Cross-repo twin:
> `arrowmaze-frontend` ticket 36.

| # | Ticket | Story | Blocked by | Phase | Priority |
|---|--------|-------|------------|-------|----------|
| 19 | 3D board geometry — depth axis (Posicion/Direccion/DefinicionTablero + persistence) | C3‴′ | 01, 14 | 7 | — |

- **Grab first:** 19 is independent of tickets 15–18; it only needs the level-authoring gate
  (01) and the mask/length-invariant machinery (14) it extends into a third axis.
- **Cross-repo agreement:** the three 3D golden boards in
  `src/shared/__fixtures__/golden-boards-3d.ts` must stay in lockstep with
  `arrowmaze-frontend` ticket 36's Dart fixtures (see that file's header note — the two
  domain models differ in shape, so only the minimal-smoke-test and unsolvable fixtures are
  structurally identical across repos).
