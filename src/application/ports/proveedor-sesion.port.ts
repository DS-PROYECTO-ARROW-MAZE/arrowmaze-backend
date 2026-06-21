export const I_PROVEEDOR_SESION = 'IProveedorSesion';

export interface PrincipalSesion {
  readonly id: string;
  readonly email: string;
}

/**
 * ADR-0002: session is reached through this injected, DI-scoped port — never a
 * static/global accessor. `guardarToken` mints a new token for a freshly-authenticated
 * principal (login); `establecerPrincipal` records a principal already verified from an
 * incoming token (the JWT guard). Both populate the same per-request state, readable via
 * `obtenerToken`/`obtenerPrincipal` for the rest of the request (e.g. Ticket 09's
 * `DecoradorSeguridad`).
 */
export interface IProveedorSesion {
  guardarToken(principal: PrincipalSesion): string;
  establecerPrincipal(token: string, principal: PrincipalSesion): void;
  obtenerToken(): string | null;
  obtenerPrincipal(): PrincipalSesion | null;
  cerrarSesion(): void;
}
