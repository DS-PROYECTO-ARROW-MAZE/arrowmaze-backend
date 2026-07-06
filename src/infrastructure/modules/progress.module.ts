import { Module } from '@nestjs/common';
import { ProgressController } from '../adapters/http/controllers/progress.controller';
import { SincronizarProgresoCasoDeUso } from '../../application/use-cases/sincronizar-progreso.use-case';
import { ObtenerProgresoCasoDeUso } from '../../application/use-cases/obtener-progreso.use-case';
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
import { IdentityModule } from './identity.module';
import {
  IGeneradorId,
  I_GENERADOR_ID,
} from '../../application/ports/generador-id.port';

@Module({
  imports: [PrismaModule, AuthModule, IdentityModule],
  controllers: [ProgressController],
  providers: [
    {
      provide: SincronizarProgresoCasoDeUso,
      useFactory: (
        repositorioProgreso: IRepositorioProgreso,
        repositorioNivel: IRepositorioNivel,
        generadorId: IGeneradorId,
      ) =>
        new SincronizarProgresoCasoDeUso(
          repositorioProgreso,
          repositorioNivel,
          new CalcularPuntuacionCasoDeUso(),
          generadorId,
        ),
      inject: [PROGRESO_REPOSITORY, NIVEL_REPOSITORY, I_GENERADOR_ID],
    },
    {
      provide: ObtenerProgresoCasoDeUso,
      useFactory: (repositorioProgreso: IRepositorioProgreso) =>
        new ObtenerProgresoCasoDeUso(repositorioProgreso),
      inject: [PROGRESO_REPOSITORY],
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
