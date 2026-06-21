import { Module } from '@nestjs/common';
import { ProgressController } from '../adapters/http/controllers/progress.controller';
import { SincronizarProgresoCasoDeUso } from '../../application/use-cases/sincronizar-progreso.use-case';
import { CalcularPuntuacionCasoDeUso } from '../../application/use-cases/calcular-puntuacion.use-case';
import {
  IRepositorioProgreso,
  PROGRESO_REPOSITORY,
} from '../../domain/repositories/progreso.repository.interface';
import {
  IRepositorioNivel,
  NIVEL_REPOSITORY,
} from '../../domain/repositories/nivel.repository.interface';
import { PrismaProgresoRepository } from '../adapters/persistence/repositories/prisma-progreso.repository';
import { PrismaNivelRepository } from '../adapters/persistence/repositories/prisma-nivel.repository';
import { PrismaModule } from '../adapters/persistence/prisma/prisma.module';
import { AuthModule } from './auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProgressController],
  providers: [
    {
      provide: SincronizarProgresoCasoDeUso,
      useFactory: (
        repositorioProgreso: IRepositorioProgreso,
        repositorioNivel: IRepositorioNivel,
      ) =>
        new SincronizarProgresoCasoDeUso(
          repositorioProgreso,
          repositorioNivel,
          new CalcularPuntuacionCasoDeUso(),
        ),
      inject: [PROGRESO_REPOSITORY, NIVEL_REPOSITORY],
    },
    {
      provide: PROGRESO_REPOSITORY,
      useClass: PrismaProgresoRepository,
    },
    {
      provide: NIVEL_REPOSITORY,
      useClass: PrismaNivelRepository,
    },
  ],
})
export class ProgressModule {}
