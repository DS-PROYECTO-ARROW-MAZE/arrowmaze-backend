# ArrowMaze Backend

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) ![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![License](https://img.shields.io/badge/License-UNLICENSED-red)

Backend for **ArrowMaze** — a logic puzzle game played on grid boards with continuous-path arrows. The player taps the head of an arrow; if the ray to the board edge is clear, the entire path is removed. The goal is to clear the board.

University project in **Desarrollo de Software** course. **NRC 25783**.
Teacher: Carlos Alonzo

## Development TEAM 01

| Member | CI Number |
|---|---|
| Blanco, Antonio | 20.613.680 |
| Márquez, Jac José | 29.710.631 |
| Fes, Mariana | 30.751.220 |

---

## Stack

- **Runtime:** Node.js + TypeScript
- **HTTP Framework:** [NestJS](https://nestjs.com/) (controllers, guards, interceptors, Swagger at `/api/docs`)
- **Persistence:** [Prisma](https://www.prisma.io/) over PostgreSQL / Supabase
- **Auth:** JWT (Passport) + bcrypt
- **Testing:** Jest (colocated unit tests `*.spec.ts`, e2e in `test/`, coverage gate ≥ 90% on domain + application)

## Architecture: 3-Ring Clean Architecture

The project follows **Clean Architecture** (Robert C. Martin) with a strict dependency rule:

```
   ┌──────────────────────────────────┐
   │        infrastructure/           │  ← NestJS, Prisma, HTTP, JWT, bcrypt
   │  ┌────────────────────────────┐  │
   │  │      application/          │  │  ← Use cases, DTOs, ports, Decorators
   │  │  ┌──────────────────────┐  │  │
   │  │  │      domain/         │  │  │  ← Entities, VOs, Aggregates, Events,
   │  │  │                      │  │  │     Solver, Scoring, Repository ports
   │  │  └──────────────────────┘  │  │
   │  └────────────────────────────┘  │
   └──────────────────────────────────┘

   domain  ←  application  ←  infrastructure
   (imports nothing         (imports only          (imports everything,
    from NestJS/Prisma)      domain)                frameworks allowed)
```

Each ring only knows the one immediately inside it. This is **enforced via ESLint**
(`no-restricted-imports`): the domain layer cannot import `@nestjs/*` or `@prisma/client`;
the application layer cannot import `@prisma/client`. Architecture tests in
`src/shared/__arch__/` validate these rules on every build.

### Layers in detail

| Layer | Responsibility | Conventions |
|---|---|---|
| **`domain/`** | Entities (`User`, `Progreso`), aggregates (`Nivel`), value objects (`Celda`, `Direccion`, `Posicion`, `DefinicionTablero`, `ResultadoPuntaje`), pure services (`Solver`, `GrafoTablero`, scoring strategies), domain exceptions, and **repository ports** (`INivelRepository`, `IUserRepository`, `IProgresoRepository`). | Zero external dependencies. Spanish naming (ubiquitous language). |
| **`application/`** | Use cases (`CrearNivelCasoDeUso`, `RegisterUserUseCase`, `LoginUseCase`, `SincronizarProgresoCasoDeUso`, `CalcularPuntuacionCasoDeUso`, etc.), application DTOs, infrastructure ports (`IHashContrasena`, `IGeneradorId`, `ProveedorSesion`, `IMedidorMetricas`, `IRegistro`), and the **Decorator stack** (security, logging, metrics at the use-case level). | Imports only `domain/`. Decorators implement `ICasoDeUso<E,S>` and depend on ports, never concrete implementations. |
| **`infrastructure/`** | NestJS controllers, Prisma adapters (repositories, mappers, queries), exception → HTTP filters, JWT guards, interceptors (leaderboard cache), security adapters (`BcryptHashAdapter`, `JwtAdapter`), and NestJS modules. | Only layer where NestJS, Prisma, and frameworks are allowed. |

![Architecture diagram](docs/arquitecturaBackend-arrowmaze.png)


### Implemented GoF Patterns

| Pattern | Description | Implementation |
|---|---|---|
| **Strategy** | Encapsulates interchangeable scoring algorithms | [`EstrategiaPuntuacion`](src/domain/services/scoring/estrategia-puntuacion.interface.ts) + [`PuntuacionPorMovimientos`](src/domain/services/scoring/puntuacion-por-movimientos.ts) + [`PuntuacionMixta`](src/domain/services/scoring/puntuacion-mixta.ts) |
| **Decorator** | Wraps use cases with cross-cutting concerns (metrics, logging, security) | [`DecoradorCasoDeUso`](src/application/decorators/decorador-caso-de-uso.ts) + [`DecoradorMetricas`](src/application/decorators/decorador-metricas.ts) + [`DecoradorRegistro`](src/application/decorators/decorador-registro.ts) + [`DecoradorSeguridad`](src/application/decorators/decorador-seguridad.ts) |
| **Observer** | Publishes domain events decoupled from the publisher | [`IPublicadorEventos`](src/domain/events/publicador-eventos.interface.ts) + [`PublicadorEventosAdapter`](src/infrastructure/adapters/messaging/publicador-eventos.adapter.ts) |
| **Repository** | Abstracts persistence behind domain-focused interfaces | [`IRepositorioNivel`](src/domain/repositories/nivel.repository.interface.ts) → [`PrismaNivelRepository`](src/infrastructure/adapters/persistence/repositories/prisma-nivel.repository.ts) |
| **Adapter** | Wraps external libraries behind application ports | [`BcryptHashAdapter`](src/infrastructure/adapters/security/bcrypt-hash.adapter.ts) · [`JwtAdapter`](src/infrastructure/adapters/security/jwt.adapter.ts) · [`CryptoGeneradorIdAdapter`](src/infrastructure/adapters/identity/crypto-generador-id.adapter.ts) |
| **Dependency Inversion** | Use cases depend on port interfaces, never concrete implementations | [`RegisterUserUseCase`](src/application/use-cases/register-user.use-case.ts) injects `IUserRepository`, `IHashContrasena`, `IPublicadorEventos`, `IGeneradorId` |


## SOLID Principles

### SRP — Single Responsibility Principle

Each class has one clearly defined responsibility:

```typescript
// src/domain/value-objects/definicion-tablero.ts
// Responsibility: encapsulate board dimensions and cell layout only
export class DefinicionTablero {
  private readonly celdas: ReadonlyArray<ReadonlyArray<Celda>>;

  private constructor(
    public readonly ancho: number,
    public readonly alto: number,
    celdas: Celda[][],
  ) { /* freezes and stores */ }

  static crear(ancho: number, alto: number, celdas: Celda[][]): DefinicionTablero { /* ... */ }
  static restaurar(ancho: number, alto: number, celdas: Celda[][]): DefinicionTablero { /* ... */ }
  celdaEn(pos: Posicion): Celda { /* ... */ }
}
```

Other examples: `User` (player identity), `Progreso` (completed run), `Celda` (single cell), `Posicion` (grid coordinate), `Direccion` (cardinal direction).

### OCP — Open / Closed Principle

The scoring system is **open for extension, closed for modification**:

```typescript
// src/domain/services/scoring/estrategia-puntuacion.interface.ts
export interface EstrategiaPuntuacion {
  calcular(nivel: Nivel, movimientos: number, segundosRestantes?: number): number;
}

// src/domain/services/scoring/puntuacion-por-movimientos.ts
export class PuntuacionPorMovimientos implements EstrategiaPuntuacion { /* untimed */ }

// src/domain/services/scoring/puntuacion-mixta.ts
export class PuntuacionMixta implements EstrategiaPuntuacion { /* timed */ }
```

New strategies implement the interface — no existing code needs modification.

### LSP — Liskov Substitution Principle

All concrete decorators are substitutable for their abstract base:

```typescript
// src/application/decorators/decorador-caso-de-uso.ts
export abstract class DecoradorCasoDeUso<E, S> implements ICasoDeUso<E, S> {
  protected constructor(protected readonly casoDeUso: ICasoDeUso<E, S>) {}
  execute(entrada: E): Promise<S> {
    return this.casoDeUso.execute(entrada);
  }
}

// src/application/decorators/decorador-metricas.ts
export class DecoradorMetricas<E, S> extends DecoradorCasoDeUso<E, S> {
  // Overrides execute, calls super, adds metrics — fully substitutable for ICasoDeUso
  async execute(entrada: E): Promise<S> {
    const inicio = Date.now();
    try { return await super.execute(entrada); }
    finally { this.medidorMetricas.registrarDuracion(this.nombreCasoDeUso, Date.now() - inicio); }
  }
}
```

### ISP — Interface Segregation Principle

Ports are small and client-specific — consumers never depend on methods they don't use:

| Port | Methods | File |
|---|---|---|
| `ICasoDeUso<E, S>` | `execute(entrada: E): Promise<S>` | [`src/application/ports/caso-de-uso.interface.ts`](src/application/ports/caso-de-uso.interface.ts) |
| `IHashContrasena` | `hash(plain)` · `compare(plain, hash)` | [`src/application/ports/hash-contrasena.port.ts`](src/application/ports/hash-contrasena.port.ts) |
| `IGeneradorId` | `generar(): string` | [`src/application/ports/generador-id.port.ts`](src/application/ports/generador-id.port.ts) |
| `IMedidorMetricas` | `registrarDuracion(nombre, duracionMs)` | [`src/application/ports/medidor-metricas.port.ts`](src/application/ports/medidor-metricas.port.ts) |
| `IRegistro` | `info(mensaje)` | [`src/application/ports/registro.port.ts`](src/application/ports/registro.port.ts) |
| `IRepositorioNivel` | `guardar(nivel)` · `obtenerPorId(id)` | [`src/domain/repositories/nivel.repository.interface.ts`](src/domain/repositories/nivel.repository.interface.ts) |
| `EstrategiaPuntuacion` | `calcular(...): number` | [`src/domain/services/scoring/estrategia-puntuacion.interface.ts`](src/domain/services/scoring/estrategia-puntuacion.interface.ts) |

### DIP — Dependency Inversion Principle

Use cases depend on **abstractions (ports/interfaces)**, never on concrete implementations:

```typescript
// src/application/use-cases/register-user.use-case.ts
export class RegisterUserUseCase {
  // Aplicando DIP: Dependemos de la abstracción (Interfaz), no de la implementación concreta
  constructor(
    private readonly userRepository: IUserRepository,       // ← port interface
    private readonly hashContrasena: IHashContrasena,       // ← port interface
    private readonly publicadorEventos: IPublicadorEventos, // ← port interface
    private readonly generadorId: IGeneradorId,             // ← port interface
  ) {}

  async execute(dto: RegisterUserDto): Promise<User> { /* ... */ }
}
```

Concrete implementations (`BcryptHashAdapter`, `PrismaUserRepository`, `PublicadorEventosAdapter`, `CryptoGeneradorIdAdapter`) are injected at runtime by the NestJS DI container from the infrastructure layer, keeping domain and application framework-free.

## AOP via SOLID (Decorator Stack)

This project implements **Aspect-Oriented Programming** without an AOP library, relying purely on SOLID principles (specifically OCP + DIP + Decorator pattern). Cross-cutting concerns are composed at the use-case level.

### Architecture

```
                    ┌─────────────────────────┐
                    │   ICasoDeUso<E, S>       │  ← Generic use-case contract
                    └──────────┬──────────────┘
                               │ implements
                    ┌──────────┴──────────────┐
                    │  DecoradorCasoDeUso<E,S> │  ← Abstract base (delegates execute)
                    └──────────┬──────────────┘
                  ┌────────────┼────────────┐
          ┌───────┴──────┐ ┌───┴───────┐ ┌──┴────────┐
          │Decorador     │ │Decorador  │ │Decorador   │
          │Metricas      │ │Registro   │ │Seguridad   │
          └───────┬──────┘ └───┬───────┘ └──┬────────┘
                  │            │             │
                  └────────────┼─────────────┘
                               │ delegates to
                    ┌──────────┴──────────────┐
                    │  Use case concreto       │  ← e.g. CrearNivelCasoDeUso
                    └─────────────────────────┘
```

### Concrete Decorators

| Decorator | Cross-cutting concern | Depends on port | File |
|---|---|---|---|
| `DecoradorMetricas` | Measures and records use-case execution duration | `IMedidorMetricas` | [`src/application/decorators/decorador-metricas.ts`](src/application/decorators/decorador-metricas.ts) |
| `DecoradorRegistro` | Logs start and finish of use-case execution | `IRegistro` | [`src/application/decorators/decorador-registro.ts`](src/application/decorators/decorador-registro.ts) |
| `DecoradorSeguridad` | Verifies authenticated session before delegating | `IProveedorSesion` | [`src/application/decorators/decorador-seguridad.ts`](src/application/decorators/decorador-seguridad.ts) |

### Key design decisions (ADR-0004)

- **Two-tier AOP**: use-case level (Decorator stack in `application/`) + transport level (NestJS interceptors in `infrastructure/`).
- **No AOP library**: composition via `implements ICasoDeUso<E,S>` and abstract `DecoradorCasoDeUso` base class.
- **Port-based**: each decorator depends on a port interface (`IMedidorMetricas`, `IRegistro`, `IProveedorSesion`), never on concrete adapters — real console I/O stays in `infrastructure/adapters/`.
- **Composable**: decorators wrap each other in any order. Integration test proves `Seguridad→Registro→Metricas→CrearNivelCasoDeUso` chain at [`src/infrastructure/modules/decorator-stack.integration.spec.ts`](src/infrastructure/modules/decorator-stack.integration.spec.ts).

## AI-Assisted Development Workflow

This project uses **[OpenCode](https://opencode.ai)** and **[claude code](https://claude.com/code)** as an AI coding agent to maintain architectural consistency across the codebase. The agent is guided by two mechanisms:

### Skills (`.agents/skills/`)

Specialized instructions the agent loads on demand when a task matches a skill's domain. Each skill acts as an expert prompt that ensures the agent follows the right patterns, conventions, and quality gates for that kind of work:

| Skill | Purpose |
|---|---|
| `clean-architecture` | Enforces dependency rules, deep modules, and proper layer boundaries |
| `nestjs-patterns` | NestJS conventions for modules, controllers, DI, guards, interceptors |
| `tdd-strict` | Red → green → refactor cycle; tests target deep-module interfaces |
| `conventional-commits` | Generates commit messages following Conventional Commits standard |
| `grill-with-docs` | Stress-tests plans against the domain model and updates ADRs/CONTEXT.md |
| `ai-usage-doc` | Maintains `AI_USAGE.md` documenting AI tool usage |
| `handoff` | Compacts the current conversation into a handoff document for another agent |
| `teach` | Teaches new skills or concepts within the workspace |
| `write-a-skill` | Creates new agent skills with proper structure |
| `zoom-out` | Provides broader context on code sections and how they fit the bigger picture |

### Project Instructions (`AGENTS.md`)

The central convention file that the agent reads automatically at the start of every session. It contains the quick-start commands, architecture overview, DI wiring gotchas, Prisma mapper conventions, testing patterns, scoring strategy, naming conventions, and the delivery DAG reference.

### Typical workflow cycle

1. The agent reads `AGENTS.md` for project-wide conventions.
2. When a task is scoped (e.g. a new use case), the matched skill is loaded (e.g. `tdd-strict` + `clean-architecture`).
3. The agent follows TDD (write failing test → implement → refactor), respects layer boundaries, and uses ubiquitous language.
4. Commits follow conventional commit format, generated via the `conventional-commits` skill.

This workflow was inspired by the AI coding patterns demonstrated by:

- **[AI Engineer](https://www.youtube.com/@aiDotEngineer)** — host of the walkthrough where Matt Pocock detailed agent-based workflows for consistent project development.
- **[Matt Pocock](https://www.youtube.com/@mattpocockuk)** — TypeScript educator whose "Full Walkthrough: Workflow for AI Coding" ([video](https://www.youtube.com/watch?v=-QFHIoCo-Ko)) demonstrates how structured agent instructions and skills drive repeatable, high-quality AI-assisted development.

## Project Structure

```
src/
├── domain/
│   ├── aggregates/          # Nivel (aggregate root)
│   ├── entities/            # User, Progreso
│   ├── events/              # Domain events + IPublicadorEventos
│   ├── exceptions/          # Domain exceptions (8 classes)
│   ├── repositories/        # Ports: INivelRepository, IUserRepository, IProgresoRepository
│   ├── services/            # Solver, GrafoTablero, PerfilDificultad, scoring strategies
│   ├── stereotypes/         # AggregateRoot, DomainEvent (base classes)
│   └── value-objects/       # Celda, Direccion, Posicion, DefinicionTablero, ResultadoPuntaje
├── application/
│   ├── decorators/          # DecoradorCasoDeUso + 3 concrete decorators
│   ├── dtos/                # Application DTOs (9 classes)
│   ├── ports/               # Ports: IHashContrasena, IGeneradorId, ProveedorSesion, etc.
│   ├── queries/             # IListarNiveles (CQRS-lite read side)
│   └── use-cases/           # 8 use cases with their specs
├── infrastructure/
│   ├── adapters/
│   │   ├── http/            # Controllers (4), HTTP DTOs, exception filters (7), guards, interceptors, presenters
│   │   ├── identity/        # CryptoGeneradorIdAdapter
│   │   ├── logging/         # RegistroConsola
│   │   ├── messaging/       # PublicadorEventosAdapter
│   │   ├── metrics/         # MedidorMetricasSimple
│   │   ├── persistence/     # PrismaService, repos, mappers, queries (leaderboard, list levels)
│   │   └── security/        # BcryptHashAdapter, JwtAdapter, ProveedorSesionAdapter
│   └── modules/             # NestJS modules (auth, levels, progress, leaderboard, identity)
└── shared/
    ├── __arch__/            # Architecture tests (domain purity, forbidden imports, ubiquitous language)
    ├── __fixtures__/        # Golden boards and golden scores (shared with Dart frontend)
    ├── constants/
    └── utils/
```

## HTTP Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Player registration |
| `POST` | `/auth/login` | Login + JWT |
| `POST` | `/levels` | Create level (authoring, solvability-gated) |
| `GET` | `/levels` | List level catalog |
| `GET` | `/levels/:id` | Get level by ID (re-validates solvability) |
| `PUT` | `/levels/:id` | Update level (re-gated) |
| `POST` | `/progress/sync` | Sync progress (batch, upsert-best) |
| `GET` | `/progress` | Get authenticated player's progress |
| `GET` | `/leaderboard` | Score leaderboard (TTL-cached) |

Interactive Swagger available at `/api/docs` when running `npm run start:dev`.

## Quick Start

### Local development

```bash
cp .env.example .env          # set DATABASE_URL (PostgreSQL / Supabase)
npm install
npx prisma generate
npm run start:dev             # server at http://localhost:3000, Swagger at /api/docs
```

### Docker

```bash
docker-compose up --build     # builds and runs the full stack (app + DB)
```

## Commands

| Command | Description |
|---|---|
| `npm run build` | NestJS compilation → `dist/` |
| `npm run start:dev` | `prisma generate` + dev server with watch |
| `npm run test` | Unit tests (Jest, colocated) |
| `npm run test:cov` | Tests + coverage (gate: domain + application ≥ 90%) |
| `npm run test:e2e` | End-to-end tests (`test/`) |
| `npm run lint` | ESLint + Prettier (auto-fix) |
| `npm run format` | Prettier manual |
| `npm run seed` | Run database seed |

## Contributing

### Conventional Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer(s)]
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `style`, `chore`, `perf`.
Scopes match the layer or module: `domain`, `application`, `infrastructure`, `auth`, `levels`, `progress`, `leaderboard`, `scoring`, `deps`.

Examples:
```
feat(levels): add solvability gate on level creation
fix(auth): return 409 on duplicate email instead of 500
test(scoring): add golden-score fixture agreement test
```

### Branch Workflow

```
main        ← production-ready, protected
  develop   ← integration branch, CI must pass
    feat/*  ← feature branches off develop
    fix/*   ← bugfix branches off develop
```

### Pull Request Process

1. Create a feature/fix branch from `develop`.
2. Implement following TDD (red → green → refactor) with colocated tests.
3. Ensure all tests pass: `npm run test`.
4. Run lint: `npm run lint`.
5. Open a PR against `develop` with a Conventional Commit title.
6. PR must be reviewed and approved before merging.

## License

UNLICENSED — private project.