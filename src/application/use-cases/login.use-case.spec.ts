import { LoginUseCase } from './login.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IHashContrasena } from '../ports/hash-contrasena.port';
import { IProveedorSesion } from '../ports/proveedor-sesion.port';
import { User } from '../../domain/entities/user.entity';
import { CredencialesInvalidasException } from '../../domain/exceptions/credenciales-invalidas.exception';
import { LoginDto } from '../dtos/login.dto';

describe('LoginUseCase', () => {
  let findByEmailMock: jest.Mock;
  let compareMock: jest.Mock;
  let guardarTokenMock: jest.Mock;
  let useCase: LoginUseCase;

  const dto: LoginDto = { email: 'jac@test.com', password: 'secreta123' };
  const usuarioExistente = new User(
    'user-id',
    dto.email,
    'hashed:secreta123',
    new Date(),
  );
  const tokenEmitido = 'jwt-token';

  beforeEach(() => {
    findByEmailMock = jest.fn();
    compareMock = jest.fn();
    guardarTokenMock = jest.fn().mockReturnValue(tokenEmitido);

    const userRepository: IUserRepository = {
      save: jest.fn(),
      findByEmail: findByEmailMock,
      findById: jest.fn(),
    };
    const hashContrasena: IHashContrasena = {
      hash: jest.fn(),
      compare: compareMock,
    };
    const proveedorSesion: IProveedorSesion = {
      guardarToken: guardarTokenMock,
      establecerPrincipal: jest.fn(),
      obtenerToken: jest.fn(),
      obtenerPrincipal: jest.fn(),
      cerrarSesion: jest.fn(),
    };

    useCase = new LoginUseCase(userRepository, hashContrasena, proveedorSesion);
  });

  it('should_throw_CredencialesInvalidasException_when_email_is_unknown', async () => {
    // Arrange
    findByEmailMock.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      CredencialesInvalidasException,
    );
    expect(guardarTokenMock).not.toHaveBeenCalled();
  });

  it('should_throw_CredencialesInvalidasException_when_password_is_wrong', async () => {
    // Arrange
    findByEmailMock.mockResolvedValue(usuarioExistente);
    compareMock.mockResolvedValue(false);

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      CredencialesInvalidasException,
    );
    expect(guardarTokenMock).not.toHaveBeenCalled();
  });

  it('should_throw_the_same_message_when_email_is_unknown_or_password_is_wrong', async () => {
    // Arrange
    findByEmailMock.mockResolvedValueOnce(null);

    // Act
    let unknownEmailMessage = '';
    try {
      await useCase.execute(dto);
    } catch (error) {
      unknownEmailMessage = (error as Error).message;
    }

    findByEmailMock.mockResolvedValueOnce(usuarioExistente);
    compareMock.mockResolvedValueOnce(false);
    let wrongPasswordMessage = '';
    try {
      await useCase.execute(dto);
    } catch (error) {
      wrongPasswordMessage = (error as Error).message;
    }

    // Assert — no user enumeration: both paths must be indistinguishable
    expect(unknownEmailMessage).toBe(wrongPasswordMessage);
  });

  it('should_return_a_token_from_the_injected_ProveedorSesion_when_credentials_are_valid', async () => {
    // Arrange
    findByEmailMock.mockResolvedValue(usuarioExistente);
    compareMock.mockResolvedValue(true);

    // Act
    const resultado = await useCase.execute(dto);

    // Assert
    expect(compareMock).toHaveBeenCalledWith(
      dto.password,
      usuarioExistente.passwordHash,
    );
    expect(guardarTokenMock).toHaveBeenCalledWith({
      id: usuarioExistente.id,
      email: usuarioExistente.email,
    });
    expect(resultado.token).toBe(tokenEmitido);
  });
});
