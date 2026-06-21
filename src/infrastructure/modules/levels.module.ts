import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LevelsController } from '../adapters/http/controllers/levels.controller';
import { CrearNivelCasoDeUso } from '../../application/use-cases/crear-nivel.use-case';
import { ActualizarNivelCasoDeUso } from '../../application/use-cases/actualizar-nivel.use-case';
import { ObtenerNivelCasoDeUso } from '../../application/use-cases/obtener-nivel.use-case';
import {
  IRepositorioNivel,
  NIVEL_REPOSITORY,
} from '../../domain/repositories/nivel.repository.interface';
import { PrismaNivelRepository } from '../adapters/persistence/repositories/prisma-nivel.repository';
import { PrismaModule } from '../adapters/persistence/prisma/prisma.module';
import { NivelNoSolvableFilter } from '../adapters/http/filters/nivel-no-solvable.filter';
import { NivelNoEncontradoFilter } from '../adapters/http/filters/nivel-no-encontrado.filter';

@Module({
  imports: [PrismaModule],
  controllers: [LevelsController],
  providers: [
    {
      provide: CrearNivelCasoDeUso,
      useFactory: (repo: IRepositorioNivel) => new CrearNivelCasoDeUso(repo),
      inject: [NIVEL_REPOSITORY],
    },
    {
      provide: ActualizarNivelCasoDeUso,
      useFactory: (repo: IRepositorioNivel) =>
        new ActualizarNivelCasoDeUso(repo),
      inject: [NIVEL_REPOSITORY],
    },
    {
      provide: ObtenerNivelCasoDeUso,
      useFactory: (repo: IRepositorioNivel) => new ObtenerNivelCasoDeUso(repo),
      inject: [NIVEL_REPOSITORY],
    },
    {
      provide: NIVEL_REPOSITORY,
      useClass: PrismaNivelRepository,
    },
    {
      provide: APP_FILTER,
      useClass: NivelNoSolvableFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NivelNoEncontradoFilter,
    },
  ],
})
export class LevelsModule {}
