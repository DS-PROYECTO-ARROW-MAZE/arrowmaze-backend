import { Injectable, Scope } from '@nestjs/common';
import {
  IProveedorSesion,
  PrincipalSesion,
} from '../../../application/ports/proveedor-sesion.port';
import { JwtAdapter } from './jwt.adapter';

// ADR-0002: request-scoped, never a static singleton — each HTTP request gets its own
// instance, so session state cannot leak between requests or tests.
@Injectable({ scope: Scope.REQUEST })
export class ProveedorSesionAdapter implements IProveedorSesion {
  private token: string | null = null;
  private principal: PrincipalSesion | null = null;

  constructor(private readonly jwtAdapter: JwtAdapter) {}

  guardarToken(principal: PrincipalSesion): string {
    const token = this.jwtAdapter.firmar(principal);
    this.token = token;
    this.principal = principal;
    return token;
  }

  establecerPrincipal(token: string, principal: PrincipalSesion): void {
    this.token = token;
    this.principal = principal;
  }

  obtenerToken(): string | null {
    return this.token;
  }

  obtenerPrincipal(): PrincipalSesion | null {
    return this.principal;
  }

  cerrarSesion(): void {
    this.token = null;
    this.principal = null;
  }
}
