import { readFileSync } from 'fs';
import { join } from 'path';
import { RegisterUserUseCase } from './register-user.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IHashContrasena } from '../ports/hash-contrasena.port';
import { IPublicadorEventos } from '../../domain/events/publicador-eventos.interface';
import { User } from '../../domain/entities/user.entity';
import { JugadorRegistradoEvent } from '../../domain/events/jugador-registrado.event';
import { EmailYaRegistradoException } from '../../domain/exceptions/email-ya-registrado.exception';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { IGeneradorId } from '../ports/generador-id.port';

describe('RegisterUserUseCase', () => {
  let saveMock: jest.Mock;
  let findByEmailMock: jest.Mock;
  let hashMock: jest.Mock;
  let publicarMock: jest.Mock;
  let useCase: RegisterUserUseCase;

  const dto: RegisterUserDto = {
    email: 'jac@test.com',
    password: 'secreta123',
  };
  const hashedPassword = 'hashed:secreta123';

  beforeEach(() => {
    saveMock = jest.fn().mockResolvedValue(undefined);
    findByEmailMock = jest.fn();
    hashMock = jest.fn().mockResolvedValue(hashedPassword);
    publicarMock = jest.fn().mockResolvedValue(undefined);

    const userRepository: IUserRepository = {
      save: saveMock,
      findByEmail: findByEmailMock,
      findById: jest.fn(),
    };
    const hashContrasena: IHashContrasena = {
      hash: hashMock,
      compare: jest.fn(),
    };
    const publicadorEventos: IPublicadorEventos = {
      publicar: publicarMock,
    };
    const generadorId: IGeneradorId = { generar: () => 'jugador-generado-1' };
    useCase = new RegisterUserUseCase(
      userRepository,
      hashContrasena,
      publicadorEventos,
      generadorId,
    );
  });

  it('should_throw_EmailYaRegistradoException_when_email_is_already_registered', async () => {
    // Arrange
    findByEmailMock.mockResolvedValue(
      new User('existing-id', dto.email, 'some-hash', new Date()),
    );

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      EmailYaRegistradoException,
    );
    expect(saveMock).not.toHaveBeenCalled();
    expect(publicarMock).not.toHaveBeenCalled();
  });

  it('should_save_a_hashed_password_when_email_is_new', async () => {
    // Arrange
    findByEmailMock.mockResolvedValue(null);

    // Act
    const newUser = await useCase.execute(dto);

    // Assert
    expect(hashMock).toHaveBeenCalledWith(dto.password);
    expect(newUser.passwordHash).toBe(hashedPassword);
    expect(newUser.passwordHash).not.toBe(dto.password);
    expect(saveMock).toHaveBeenCalledWith(newUser);
  });

  it('should_publish_the_recorded_JugadorRegistradoEvent_after_save_when_email_is_new', async () => {
    // Arrange
    findByEmailMock.mockResolvedValue(null);
    const ordenDeLlamadas: string[] = [];
    saveMock.mockImplementation(() => {
      ordenDeLlamadas.push('save');
      return Promise.resolve();
    });
    publicarMock.mockImplementation(() => {
      ordenDeLlamadas.push('publicar');
      return Promise.resolve();
    });

    // Act
    const newUser = await useCase.execute(dto);

    // Assert
    expect(ordenDeLlamadas).toEqual(['save', 'publicar']);
    expect(publicarMock).toHaveBeenCalledTimes(1);
    const eventosPublicados = publicarMock.mock
      .calls[0][0] as JugadorRegistradoEvent[];
    expect(eventosPublicados).toHaveLength(1);
    expect(eventosPublicados[0]).toBeInstanceOf(JugadorRegistradoEvent);
    expect(eventosPublicados[0].id).toBe(newUser.id);
    expect(eventosPublicados[0].email).toBe(newUser.email);
  });

  it('should_clear_the_recorded_domain_events_after_publishing_when_email_is_new', async () => {
    // Arrange
    findByEmailMock.mockResolvedValue(null);

    // Act
    const newUser = await useCase.execute(dto);

    // Assert
    expect(newUser.domainEvents).toEqual([]);
  });

  it('should_not_import_bcrypt_when_reading_its_own_source', () => {
    // Arrange
    const sourcePath = join(__dirname, 'register-user.use-case.ts');

    // Act
    const source = readFileSync(sourcePath, 'utf-8');

    // Assert
    expect(source).not.toMatch(/bcrypt/i);
  });
});
