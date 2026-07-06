import { Prisma } from '@prisma/client';
import { Progreso } from '../../../../domain/entities/progreso';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ProgresoPrismaRow = Prisma.ProgresoGetPayload<{}>;

export class ProgresoPrismaMapper {
  static toDomain(row: ProgresoPrismaRow): Progreso {
    return Progreso.crear({
      id: row.id,
      jugadorId: row.jugadorId,
      nivelId: row.nivelId,
      movimientos: row.movimientos,
      segundosRestantes: row.segundosRestantes ?? undefined,
      puntaje: row.puntaje,
      estrellas: row.estrellas,
      completadoEn: row.completadoEn,
    });
  }

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

  // High-score update: replace the scored fields of the stored best (ticket 13). Identity
  // and the (jugador, nivel) pair stay put — only the run's outcome moves.
  static toUpdateInput(progreso: Progreso): Prisma.ProgresoUpdateInput {
    return {
      movimientos: progreso.movimientos,
      segundosRestantes: progreso.segundosRestantes ?? null,
      puntaje: progreso.puntaje,
      estrellas: progreso.estrellas,
      completadoEn: progreso.completadoEn,
    };
  }
}
