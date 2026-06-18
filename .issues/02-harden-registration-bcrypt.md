# 02 — Harden registration (bcrypt + domain exception)

**Phase:** 1 (foundation — parallel with 01) · **Story:** E1 · **Blocks:** 06, 10

> A thin slice that upgrades the *already-shipped* `POST /auth/register` tracer bullet
> from "works on the happy path" to "production-honest": passwords are hashed, and a
> duplicate email raises a typed **domain exception** instead of a bare `Error`.
> Independent of the level pipeline — grab it in parallel with **01**.

## User story

> **E1 — Register.** *As a guest, I can create an account.*
>
> - **Given** valid credentials, **When** I register, **Then** a `User` is persisted
>   (unique email, **hashed password**) atomically via a Prisma single write
>   (no Unit of Work, ADR-0003).

Current debt (see `register-user.use-case.ts:25`): password stored in clear, duplicate
throws generic `Error`. This ticket closes both.

## Deep modules touched

- **DM-B2** — `RegisterUserUseCase`: introduce a `IHashContraseña` **port**
  (`src/application/ports/hash-contrasena.port.ts`) so the use case asks for a hash and
  never imports `bcrypt` directly (dependency rule).
- **DM-B3** — `IUserRepository` / `PrismaUserRepository` (unchanged interface; relies on
  the existing `@unique` email constraint).

## Layers crossed

```
APP   src/application/use-cases/register-user.use-case.ts            (use port, throw domain exc.)
      src/application/ports/hash-contrasena.port.ts                  (new port + token)
DOM   src/domain/exceptions/email-ya-registrado.exception.ts         (new typed exception)
INFRA src/infrastructure/adapters/security/bcrypt-hash.adapter.ts    (implements port, the ONLY bcrypt import)
WIRE  src/infrastructure/modules/auth.module.ts                      (bind port → adapter)
HTTP  auth.controller.ts                                             (map exception → 409)
```

## TDD plan (🔴 → 🟢 → ♻️)

Follow PRD §7.7 ("Register persists `User`; unique email enforced; duplicate → domain
exception; password hashed").

### Step 1 — Use case with fakes (`register-user.use-case.spec.ts`)
- 🔴
  - duplicate email (fake repo `findByEmail` returns a user) → throws
    `EmailYaRegistradoException` (assert **type**, not message; assert `save` not called).
  - happy path → `save` called with a `User` whose `passwordHash` is the **fake hasher's
    output**, never the raw password (assert `passwordHash !== dto.password`).
  - the use case **does not import `bcrypt`** — it calls the injected `IHashContraseña`.
- 🟢 Inject the port, replace `new Error(...)` with the domain exception, hash before
  constructing `User`.
- ♻️ Remove the stale "Sprint 3 / por ahora la pasamos directo" comment.

### Step 2 — bcrypt adapter (`bcrypt-hash.adapter.spec.ts`)
- 🔴 `hash(plain)` returns a string `!== plain`; `compare(plain, hash)` is `true` for the
  matching pair and `false` otherwise.
- 🟢 Implement with `bcrypt` (already in deps). Salt rounds from config.
- ♻️ This file is the single permitted `bcrypt` import site.

### Step 3 — HTTP e2e (`test/auth.e2e-spec.ts`)
- 🔴 Registering the same email twice → second call **409 Conflict**; DB has exactly one
  row; stored `password_hash` is not the plaintext.
- 🟢 Add an exception filter / mapping for `EmailYaRegistradoException` → 409.
- ♻️ Confirm atomicity is the single upsert/write (no UoW, ADR-0003).

## Definition of Done
- Plaintext passwords never persisted (asserted in e2e).
- Duplicate path returns typed domain exception → 409; `save` provably skipped.
- `bcrypt` appears only in the security adapter; application/domain stay framework-free.
