import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IListarNiveles } from '../../../../application/queries/listar-niveles.interface';
import { NivelResumenDto } from '../../../../application/dtos/nivel-resumen.dto';

@Injectable()
export class ListarNivelesPrisma implements IListarNiveles {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<NivelResumenDto[]> {
    // `select` (not `include`) projects summary columns only, so the board `celdas`
    // relation never loads — the list stays a lightweight, ordered catalog.
    const filas = await this.prisma.nivel.findMany({
      orderBy: { numero: 'asc' },
      select: {
        id: true,
        numero: true,
        nombre: true,
        dificultad: true,
        esBonus: true,
        ancho: true,
        alto: true,
      },
    });

    return filas.map((fila) => ({
      id: fila.id,
      numero: fila.numero,
      nombre: fila.nombre,
      dificultad: fila.dificultad,
      esBonus: fila.esBonus,
      ancho: fila.ancho,
      alto: fila.alto,
    }));
  }
}
