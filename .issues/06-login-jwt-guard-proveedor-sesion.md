# 06 — Login + JWT guard + `ProveedorSesion` port

**Phase:** 2 · **Story:** NFR Security / DM-B6 · **Blocked by:** 02

> Establishes the authenticated edge and the **injected session** the rest of the system
> depends on. Critically, it introduces `ProveedorSesion` as a **port** (ADR-0002: session
> is DI-lifetime via an injected port, *not* a static singleton) — which ticket 09's
> `DecoradorSeguridad` will read. Login can only verify credentials once passwords are
> hashed, hence the dependency on ticket 02.

## User story / requirement

> **NFR Security (PRD §8).** Hashed passwords; auth via guards; session through an
> **injected `ProveedorSesion`** (no global token). `DecoradorSeguridad` reads session via
> the injected `ProveedorSesion`, never a static accessor (PRD §7.6).

## Deep modules touched

- **DM-B6** — HTTP transport: login endpoint + a JWT auth **guard**.
- **Security port** — `ProveedorSesion` (`obtenerToken` / `guardarToken` /
  `cerrarSesion`, and read current principal) with a Nest-scoped implementation.

## Layers crossed

```
DOM   src/domain/repositories/user.repository.interface.ts   (reuse findByEmail)
APP   src/application/use-cases/login.use-case.ts             (verify hash → issue token via port)
      src/application/ports/proveedor-sesion.port.ts          (+ token)
      src/application/ports/hash-contrasena.port.ts           (reuse from 02 for compare)
INFRA src/infrastructure/adapters/security/proveedor-sesion.adapter.ts  (request-scoped)
      src/infrastructure/adapters/security/jwt.adapter.ts     (the only @nestjs/jwt site)
      src/infrastructure/adapters/http/guards/jwt-auth.guard.ts
HTTP  auth.controller.ts                                      (POST /auth/login)
WIRE  auth.module.ts                                          (JwtModule, bind ports)
```

## TDD plan (🔴 → 🟢 → ♻️)

### Step 1 — Login use case (`login.use-case.spec.ts`, fakes)
- 🔴
  - unknown email → `CredencialesInvalidasException`.
  - wrong password (fake hasher `compare` → false) → `CredencialesInvalidasException`
    (same exception/message as unknown email — no user enumeration).
  - valid credentials → returns a token obtained from the **injected `ProveedorSesion`**
    (assert the port was called; the use case never imports `@nestjs/jwt`).
- 🟢 Implement: load user, `compare`, issue token via port.
- ♻️ Keep token issuance behind the port; JWT specifics live in the adapter only.

### Step 2 — JWT guard (`jwt-auth.guard.spec.ts`)
- 🔴 Missing/invalid bearer token → request rejected (401); valid token → principal
  available via `ProveedorSesion`.
- 🟢 Implement guard delegating verification to `jwt.adapter`.
- ♻️ Ensure `ProveedorSesion` exposes the current principal for downstream decorators.

### Step 3 — e2e (`test/auth.e2e-spec.ts`, extend)
- 🔴 Register (ticket 02) → login → 200 with token; bad password → 401. A protected probe
  route returns 401 without a token, 200 with the issued token.
- 🟢 Wire `JwtModule`, guard, route.
- ♻️ Confirm **no static/global token accessor** anywhere (grep guard, supports §7.6).

## Definition of Done
- `ProveedorSesion` is injectable and request-scoped; no static singleton (ADR-0002).
- Login verifies against bcrypt hashes from ticket 02; uniform invalid-credential response.
- Guard protects routes; token flows through the port — ready for ticket 09.
