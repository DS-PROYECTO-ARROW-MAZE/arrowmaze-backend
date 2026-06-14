import { Module } from '@nestjs/common';
import { AuthController } from '../adapters/http/controllers/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { I_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../adapters/persistence/repositories/prisma-user.repository';
import { PrismaModule } from '../adapters/persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    {
      provide: I_USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
})
export class AuthModule {}
