import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { I_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class RegisterUserUseCase {
  // Aplicando DIP: Dependemos de la abstracción (Interfaz), no de la implementación concreta
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: RegisterUserDto): Promise<User> {
    // 1. Verificar si el usuario ya existe usando el puerto
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new Error('El usuario ya está registrado en ArrowMaze');
    }

    // 2. Crear la entidad de dominio pura
    // (Nota: En el Sprint 3 añadiremos bcrypt para hashear la contraseña, por ahora la pasamos directo)
    const newUser = new User(randomUUID(), dto.email, dto.password, new Date());

    // 3. Persistir la entidad usando el puerto
    await this.userRepository.save(newUser);

    return newUser;
  }
}
