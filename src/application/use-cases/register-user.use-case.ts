import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { I_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { EmailYaRegistradoException } from '../../domain/exceptions/email-ya-registrado.exception';
import { I_HASH_CONTRASENA } from '../ports/hash-contrasena.port';
import type { IHashContrasena } from '../ports/hash-contrasena.port';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class RegisterUserUseCase {
  // Aplicando DIP: Dependemos de la abstracción (Interfaz), no de la implementación concreta
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(I_HASH_CONTRASENA)
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
