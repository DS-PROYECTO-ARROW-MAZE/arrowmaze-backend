import { User } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { EmailYaRegistradoException } from '../../domain/exceptions/email-ya-registrado.exception';
import type { IHashContrasena } from '../ports/hash-contrasena.port';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { randomUUID } from 'crypto';

export class RegisterUserUseCase {
  // Aplicando DIP: Dependemos de la abstracción (Interfaz), no de la implementación concreta
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashContrasena: IHashContrasena,
  ) {}

  async execute(dto: RegisterUserDto): Promise<User> {
    // 1. Verificar si el usuario ya existe usando el puerto
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new EmailYaRegistradoException(dto.email);
    }

    // 2. Crear la entidad de dominio pura, con la contraseña ya hasheada
    const passwordHash = await this.hashContrasena.hash(dto.password);
    const newUser = new User(randomUUID(), dto.email, passwordHash, new Date());

    // 3. Persistir la entidad usando el puerto
    await this.userRepository.save(newUser);

    return newUser;
  }
}
