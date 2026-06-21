import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IProveedorSesion } from '../ports/proveedor-sesion.port';
import { NoAutorizadoException } from '../../domain/exceptions/no-autorizado.exception';
import { DecoradorSeguridad } from './decorador-seguridad';

function crearProveedorSesionFalso(
  overrides: Partial<IProveedorSesion> = {},
): IProveedorSesion {
  return {
    guardarToken: jest.fn(),
    establecerPrincipal: jest.fn(),
    obtenerToken: jest.fn(),
    obtenerPrincipal: jest.fn().mockReturnValue(null),
    cerrarSesion: jest.fn(),
    ...overrides,
  };
}

describe('DecoradorSeguridad', () => {
  it('should_throw_NoAutorizadoException_when_there_is_no_principal_in_the_injected_session', async () => {
    // Arrange
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn().mockResolvedValue('ok'),
    };
    const proveedorSesion = crearProveedorSesionFalso({
      obtenerPrincipal: jest.fn().mockReturnValue(null),
    });
    const decorador = new DecoradorSeguridad(casoDeUsoBase, proveedorSesion);

    // Act & Assert
    await expect(decorador.execute('entrada')).rejects.toBeInstanceOf(
      NoAutorizadoException,
    );
    expect(casoDeUsoBase.execute).not.toHaveBeenCalled();
  });

  it('should_delegate_to_the_wrapped_use_case_when_the_injected_session_has_a_principal', async () => {
    // Arrange
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn().mockResolvedValue('ok'),
    };
    const proveedorSesion = crearProveedorSesionFalso({
      obtenerPrincipal: jest
        .fn()
        .mockReturnValue({ id: 'user-id', email: 'jac@test.com' }),
    });
    const decorador = new DecoradorSeguridad(casoDeUsoBase, proveedorSesion);

    // Act
    const resultado = await decorador.execute('entrada');

    // Assert
    expect(resultado).toBe('ok');
    expect(casoDeUsoBase.execute).toHaveBeenCalledWith('entrada');
  });

  it('should_read_the_principal_from_the_injected_ProveedorSesion_port_and_never_a_static_accessor', async () => {
    // Arrange — the only way this decorator can see a principal is via the port we
    // construct it with; there is no global/static session to fall back on.
    const obtenerPrincipalMock = jest
      .fn()
      .mockReturnValue({ id: 'user-id', email: 'jac@test.com' });
    const proveedorSesion = crearProveedorSesionFalso({
      obtenerPrincipal: obtenerPrincipalMock,
    });
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn().mockResolvedValue('ok'),
    };
    const decorador = new DecoradorSeguridad(casoDeUsoBase, proveedorSesion);

    // Act
    await decorador.execute('entrada');

    // Assert
    expect(obtenerPrincipalMock).toHaveBeenCalledTimes(1);
  });
});
