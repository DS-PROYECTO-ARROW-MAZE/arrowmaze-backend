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
import { ListarNivelesPrisma } from '../adapters/persistence/queries/listar-niveles-prisma';
import { I_LISTAR_NIVELES } from '../../application/queries/listar-niveles.interface';
import { PrismaModule } from '../adapters/persistence/prisma/prisma.module';
import { NivelNoSolvableFilter } from '../adapters/http/filters/nivel-no-solvable.filter';
import { NivelNoEncontradoFilter } from '../adapters/http/filters/nivel-no-encontrado.filter';
import { FlechaLongitudInvalidaFilter } from '../adapters/http/filters/flecha-longitud-invalida.filter';
import { ReglaTiempoNivelFilter } from '../adapters/http/filters/regla-tiempo-nivel.filter';
import { NumeroNivelDuplicadoFilter } from '../adapters/http/filters/numero-nivel-duplicado.filter';
import { IdentityModule } from './identity.module';
import {
  IGeneradorId,
  I_GENERADOR_ID,
} from '../../application/ports/generador-id.port';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [LevelsController],
  providers: [
    {
      provide: CrearNivelCasoDeUso,
      useFactory: (repo: IRepositorioNivel, generadorId: IGeneradorId) =>
        new CrearNivelCasoDeUso(repo, generadorId),
      inject: [NIVEL_REPOSITORY, I_GENERADOR_ID],
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
      provide: I_LISTAR_NIVELES,
      useClass: ListarNivelesPrisma,
    },
    {
      provide: APP_FILTER,
      useClass: NivelNoSolvableFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NivelNoEncontradoFilter,
    },
    {
      provide: APP_FILTER,
      useClass: FlechaLongitudInvalidaFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ReglaTiempoNivelFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NumeroNivelDuplicadoFilter,
    },
  ],
})
export class LevelsModule {}
