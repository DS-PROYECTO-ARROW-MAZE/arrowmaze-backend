import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAdapter } from '../../security/jwt.adapter';
import { I_PROVEEDOR_SESION } from '../../../../application/ports/proveedor-sesion.port';
import type { IProveedorSesion } from '../../../../application/ports/proveedor-sesion.port';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAdapter: JwtAdapter,
    @Inject(I_PROVEEDOR_SESION)
    private readonly proveedorSesion: IProveedorSesion,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extraerToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const principal = this.jwtAdapter.verificar(token);
    if (!principal) {
      throw new UnauthorizedException();
    }

    this.proveedorSesion.establecerPrincipal(token, principal);
    return true;
  }

  private extraerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      return null;
    }
    return header.slice(BEARER_PREFIX.length).trim() || null;
  }
}
