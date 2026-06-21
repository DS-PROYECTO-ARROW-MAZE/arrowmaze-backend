import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IConsultaRanking } from '../../../../application/ports/consulta-ranking.port';
import {
  RankingDto,
  EntradaRankingDto,
} from '../../../../application/dtos/ranking.dto';

@Injectable()
export class ConsultaRankingPrisma implements IConsultaRanking {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTop(idNivel: string, limite: number): Promise<RankingDto> {
    const filas = await this.prisma.progreso.findMany({
      where: { nivelId: idNivel },
      orderBy: [{ puntaje: 'desc' }, { completadoEn: 'asc' }],
      take: limite,
      include: { jugador: { select: { email: true } } },
    });

    const entradas: EntradaRankingDto[] = filas.map((fila) => ({
      puntaje: fila.puntaje,
      estrellas: fila.estrellas,
      movimientos: fila.movimientos,
      segundosRestantes: fila.segundosRestantes,
      completadoEn: fila.completadoEn.toISOString(),
      email: fila.jugador.email,
    }));

    return { entradas };
  }
}
