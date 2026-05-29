import { Module } from '@nestjs/common';
import { AuthController } from '../../adapters/controllers/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { I_USER_REPOSITORY } from '../../domain/ports/user.repository.interface';
import { InMemoryUserRepository } from '../database/in-memory-user.repository';

@Module({
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase, // Registramos el caso de uso
    {
      // Aquí le decimos a NestJS: "Cuando alguien pida el I_USER_REPOSITORY..."
      provide: I_USER_REPOSITORY,
      // "...entrégale esta implementación concreta"
      useClass: InMemoryUserRepository,
    },
  ],
})
export class AuthModule {}
