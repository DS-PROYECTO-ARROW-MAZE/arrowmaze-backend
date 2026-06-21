import { JwtAdapter } from './jwt.adapter';
import { ProveedorSesionAdapter } from './proveedor-sesion.adapter';

describe('ProveedorSesionAdapter', () => {
  let firmarMock: jest.Mock;
  let adapter: ProveedorSesionAdapter;
  const principal = { id: 'user-id', email: 'jac@test.com' };

  beforeEach(() => {
    firmarMock = jest.fn().mockReturnValue('jwt-token');
    const jwtAdapter = {
      firmar: firmarMock,
      verificar: jest.fn(),
    } as unknown as JwtAdapter;
    adapter = new ProveedorSesionAdapter(jwtAdapter);
  });

  it('should_return_null_when_no_session_has_been_established_yet', () => {
    expect(adapter.obtenerToken()).toBeNull();
    expect(adapter.obtenerPrincipal()).toBeNull();
  });

  it('should_mint_and_store_a_token_when_guardarToken_is_called', () => {
    const token = adapter.guardarToken(principal);

    expect(firmarMock).toHaveBeenCalledWith(principal);
    expect(token).toBe('jwt-token');
    expect(adapter.obtenerToken()).toBe('jwt-token');
    expect(adapter.obtenerPrincipal()).toEqual(principal);
  });

  it('should_store_the_given_token_and_principal_when_establecerPrincipal_is_called', () => {
    adapter.establecerPrincipal('externally-verified-token', principal);

    expect(firmarMock).not.toHaveBeenCalled();
    expect(adapter.obtenerToken()).toBe('externally-verified-token');
    expect(adapter.obtenerPrincipal()).toEqual(principal);
  });

  it('should_clear_the_session_when_cerrarSesion_is_called', () => {
    adapter.guardarToken(principal);

    adapter.cerrarSesion();

    expect(adapter.obtenerToken()).toBeNull();
    expect(adapter.obtenerPrincipal()).toBeNull();
  });
});
