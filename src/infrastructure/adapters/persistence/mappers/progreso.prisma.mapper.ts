import { Prisma } from '@prisma/client';
import { Progreso } from '../../../../domain/entities/progreso';

export class ProgresoPrismaMapper {
  static toCreateInput(progreso: Progreso): Prisma.ProgresoCreateInput {
    return {
      id: progreso.id,
      movimientos: progreso.movimientos,
      segundosRestantes: progreso.segundosRestantes ?? null,
      puntaje: progreso.puntaje,
      estrellas: progreso.estrellas,
      completadoEn: progreso.completadoEn,
      jugador: { connect: { id: progreso.jugadorId } },
      nivel: { connect: { id: progreso.nivelId } },
    };
  }
}
