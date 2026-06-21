import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAdapter } from '../../security/jwt.adapter';
import { IProveedorSesion } from '../../../../application/ports/proveedor-sesion.port';
import { JwtAuthGuard } from './jwt-auth.guard';

function crearContexto(authorizationHeader?: string): ExecutionContext {
  const request = { headers: { authorization: authorizationHeader } };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let verificarMock: jest.Mock;
  let establecerPrincipalMock: jest.Mock;
  let guard: JwtAuthGuard;
  const principal = { id: 'user-id', email: 'jac@test.com' };

  beforeEach(() => {
    verificarMock = jest.fn();
    establecerPrincipalMock = jest.fn();

    const jwtAdapter = {
      firmar: jest.fn(),
      verificar: verificarMock,
    } as unknown as JwtAdapter;
    const proveedorSesion: IProveedorSesion = {
      guardarToken: jest.fn(),
      establecerPrincipal: establecerPrincipalMock,
      obtenerToken: jest.fn(),
      obtenerPrincipal: jest.fn(),
      cerrarSesion: jest.fn(),
    };

    guard = new JwtAuthGuard(jwtAdapter, proveedorSesion);
  });

  it('should_throw_UnauthorizedException_when_authorization_header_is_missing', () => {
    const context = crearContexto(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(verificarMock).not.toHaveBeenCalled();
  });

  it('should_throw_UnauthorizedException_when_header_is_not_a_bearer_token', () => {
    const context = crearContexto('Basic abc123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(verificarMock).not.toHaveBeenCalled();
  });

  it('should_throw_UnauthorizedException_when_token_is_invalid', () => {
    verificarMock.mockReturnValue(null);
    const context = crearContexto('Bearer bad-token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(establecerPrincipalMock).not.toHaveBeenCalled();
  });

  it('should_allow_the_request_and_store_the_principal_when_token_is_valid', () => {
    verificarMock.mockReturnValue(principal);
    const context = crearContexto('Bearer good-token');

    const resultado = guard.canActivate(context);

    expect(resultado).toBe(true);
    expect(verificarMock).toHaveBeenCalledWith('good-token');
    expect(establecerPrincipalMock).toHaveBeenCalledWith(
      'good-token',
      principal,
    );
  });
});
