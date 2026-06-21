import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrincipalSesion } from '../../../application/ports/proveedor-sesion.port';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtAdapter {
  constructor(private readonly jwtService: JwtService) {}

  firmar(principal: PrincipalSesion): string {
    const payload: JwtPayload = { sub: principal.id, email: principal.email };
    return this.jwtService.sign(payload);
  }

  verificar(token: string): PrincipalSesion | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return { id: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }
}
