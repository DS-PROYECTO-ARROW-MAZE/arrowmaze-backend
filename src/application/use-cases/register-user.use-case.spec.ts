import { readFileSync } from 'fs';
import { join } from 'path';
import { RegisterUserUseCase } from './register-user.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IHashContrasena } from '../ports/hash-contrasena.port';
import { User } from '../../domain/entities/user.entity';
import { EmailYaRegistradoException } from '../../domain/exceptions/email-ya-registrado.exception';
import { RegisterUserDto } from '../dtos/register-user.dto';

describe('RegisterUserUseCase', () => {
  let saveMock: jest.Mock;
  let findByEmailMock: jest.Mock;
  let hashMock: jest.Mock;
  let useCase: RegisterUserUseCase;

  const dto: RegisterUserDto = {
    email: 'jac@test.com',
    password: 'secreta123',
  };
  const hashedPassword = 'hashed:secreta123';

  beforeEach(() => {
    saveMock = jest.fn();
    findByEmailMock = jest.fn();
    hashMock = jest.fn().mockResolvedValue(hashedPassword);

    const userRepository: IUserRepository = {
      save: saveMock,
      findByEmail: findByEmailMock,
      findById: jest.fn(),
    };
    const hashContrasena: IHashContrasena = {
      hash: hashMock,
      compare: jest.fn(),
    };
    useCase = new RegisterUserUseCase(userRepository, hashContrasena);
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

  it('should_not_import_bcrypt_when_reading_its_own_source', () => {
    // Arrange
    const sourcePath = join(__dirname, 'register-user.use-case.ts');

    // Act
    const source = readFileSync(sourcePath, 'utf-8');

    // Assert
    expect(source).not.toMatch(/bcrypt/i);
  });
});
