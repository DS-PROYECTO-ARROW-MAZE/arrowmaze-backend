import { Module } from '@nestjs/common';
import { AuthController } from '../adapters/controllers/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { I_USER_REPOSITORY } from '../../domain/ports/user.repository.interface';
import { SupabaseUserRepository } from '../database/supabase/supabase-user.repository';
import { SupabaseModule } from '../database/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    {
      provide: I_USER_REPOSITORY,
      useClass: SupabaseUserRepository,
    },
  ],
})
export class AuthModule { }
