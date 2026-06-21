import { Module } from '@nestjs/common';
import { AuthController } from '../adapters/http/controllers/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { I_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { I_HASH_CONTRASENA } from '../../application/ports/hash-contrasena.port';
import { PrismaUserRepository } from '../adapters/persistence/repositories/prisma-user.repository';
import { PrismaModule } from '../adapters/persistence/prisma/prisma.module';
import { BcryptHashAdapter } from '../adapters/security/bcrypt-hash.adapter';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    {
      provide: I_USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: I_HASH_CONTRASENA,
      useClass: BcryptHashAdapter,
    },
  ],
})
export class AuthModule {}
