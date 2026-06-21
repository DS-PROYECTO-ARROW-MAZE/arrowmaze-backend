import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../adapters/http/controllers/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { I_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { IHashContrasena } from '../../application/ports/hash-contrasena.port';
import { I_HASH_CONTRASENA } from '../../application/ports/hash-contrasena.port';
import { IProveedorSesion } from '../../application/ports/proveedor-sesion.port';
import { I_PROVEEDOR_SESION } from '../../application/ports/proveedor-sesion.port';
import { IPublicadorEventos } from '../../domain/events/publicador-eventos.interface';
import { I_PUBLICADOR_EVENTOS } from '../../domain/events/publicador-eventos.interface';
import { PrismaUserRepository } from '../adapters/persistence/repositories/prisma-user.repository';
import { PrismaModule } from '../adapters/persistence/prisma/prisma.module';
import { BcryptHashAdapter } from '../adapters/security/bcrypt-hash.adapter';
import { JwtAdapter } from '../adapters/security/jwt.adapter';
import { ProveedorSesionAdapter } from '../adapters/security/proveedor-sesion.adapter';
import { JwtAuthGuard } from '../adapters/http/guards/jwt-auth.guard';
import { PublicadorEventosAdapter } from '../adapters/messaging/publicador-eventos.adapter';

const DEFAULT_JWT_SECRET = 'dev-secret-change-me';
const DEFAULT_JWT_EXPIRES_IN = '1h';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? DEFAULT_JWT_SECRET,
        signOptions: {
          expiresIn:
            configService.get<string>('JWT_EXPIRES_IN') ??
            DEFAULT_JWT_EXPIRES_IN,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: RegisterUserUseCase,
      useFactory: (
        repo: IUserRepository,
        hasher: IHashContrasena,
        publicadorEventos: IPublicadorEventos,
      ) => new RegisterUserUseCase(repo, hasher, publicadorEventos),
      inject: [I_USER_REPOSITORY, I_HASH_CONTRASENA, I_PUBLICADOR_EVENTOS],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        repo: IUserRepository,
        hasher: IHashContrasena,
        proveedorSesion: IProveedorSesion,
      ) => new LoginUseCase(repo, hasher, proveedorSesion),
      inject: [I_USER_REPOSITORY, I_HASH_CONTRASENA, I_PROVEEDOR_SESION],
    },
    {
      provide: I_USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: I_HASH_CONTRASENA,
      useClass: BcryptHashAdapter,
    },
    {
      provide: I_PROVEEDOR_SESION,
      useClass: ProveedorSesionAdapter,
    },
    {
      provide: I_PUBLICADOR_EVENTOS,
      useClass: PublicadorEventosAdapter,
    },
    JwtAdapter,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
