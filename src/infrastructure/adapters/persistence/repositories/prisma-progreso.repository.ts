import { Injectable } from '@nestjs/common';
import { IRepositorioProgreso } from '../../../../domain/repositories/progreso.repository.interface';
import { Progreso } from '../../../../domain/entities/progreso';
import { PrismaService } from '../prisma/prisma.service';
import { ProgresoPrismaMapper } from '../mappers/progreso.prisma.mapper';

// Strictly-greater comparison: a run updates the stored best only when it beats it; ties
// and losses are no-ops (ticket 13). Kept as a small named predicate for clarity/reuse.
const esMejorPuntaje = (candidato: number, almacenado: number): boolean =>
  candidato > almacenado;

@Injectable()
export class PrismaProgresoRepository implements IRepositorioProgreso {
  constructor(private readonly prisma: PrismaService) {}

  // ADR-0003: the $transaction is encapsulated here, inside the adapter — the application
  // layer hands over a plain Progreso[] and never names Prisma.
  //
  // High-score persistence (ticket 13): per (jugador, nivel) we keep only the best result.
  // Each run upserts against the @@unique([jugadorId, nivelId]) invariant, writing only when
  // its puntaje is strictly higher than the stored one, so a losing run is a no-op.
  async guardarLote(progresos: Progreso[]): Promise<void> {
    const mejoresPorNivel = this.colapsarAMejorPorNivel(progresos);

    await this.prisma.$transaction(async (tx) => {
      for (const progreso of mejoresPorNivel) {
        const where = {
          jugadorId_nivelId: {
            jugadorId: progreso.jugadorId,
            nivelId: progreso.nivelId,
          },
        };

        const almacenado = await tx.progreso.findUnique({ where });

        if (!almacenado) {
          await tx.progreso.create({
            data: ProgresoPrismaMapper.toCreateInput(progreso),
          });
          continue;
        }

        if (esMejorPuntaje(progreso.puntaje, almacenado.puntaje)) {
          await tx.progreso.update({
            where,
            data: ProgresoPrismaMapper.toUpdateInput(progreso),
          });
        }
      }
    });
  }

  // Collapse a batch to a single best run per (jugador, nivel) before touching the DB, so two
  // runs of the same level never produce partial/duplicate writes — only the max survives.
  private colapsarAMejorPorNivel(progresos: Progreso[]): Progreso[] {
    const mejores = new Map<string, Progreso>();

    for (const progreso of progresos) {
      const clave = `${progreso.jugadorId}:${progreso.nivelId}`;
      const actual = mejores.get(clave);
      if (!actual || esMejorPuntaje(progreso.puntaje, actual.puntaje)) {
        mejores.set(clave, progreso);
      }
    }

    return [...mejores.values()];
  }
}
