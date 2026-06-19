import { Nivel } from '../../../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../../../domain/value-objects/definicion-tablero';
import {
  FabricaCeldasEstandar,
  Celda,
} from '../../../../domain/value-objects/celda';
import { Direccion } from '../../../../domain/value-objects/direccion';
import { Posicion } from '../../../../domain/value-objects/posicion';
import { Prisma } from '@prisma/client';

type NivelPrismaRow = Prisma.NivelGetPayload<{
  include: { celdas: true };
}>;

export class NivelPrismaMapper {
  static toPersistence(nivel: Nivel): Prisma.NivelCreateInput {
    return {
      id: nivel.id,
      nombre: nivel.nombre,
      dificultad: nivel.dificultad,
      ancho: nivel.ancho,
      alto: nivel.alto,
      baseNivel: nivel.baseNivel,
      kmov: nivel.kmov,
      ktiempo: nivel.ktiempo,
      umbralEstrella1: nivel.umbralEstrella1,
      umbralEstrella2: nivel.umbralEstrella2,
      umbralEstrella3: nivel.umbralEstrella3,
      limiteTiempo: nivel.limiteTiempo ?? null,
      celdas: {
        create: this.celdasToPersistence(nivel),
      },
    };
  }

  static toDomain(row: NivelPrismaRow): Nivel {
    const celdas = this.celdasMatrixFromRows(row);

    const definicionTablero = DefinicionTablero.restaurar(
      row.ancho,
      row.alto,
      celdas,
    );

    return Nivel.crear({
      id: row.id,
      nombre: row.nombre,
      dificultad: row.dificultad,
      definicionTablero,
      ancho: row.ancho,
      alto: row.alto,
      baseNivel: row.baseNivel,
      kmov: row.kmov,
      ktiempo: row.ktiempo,
      umbralEstrella1: row.umbralEstrella1,
      umbralEstrella2: row.umbralEstrella2,
      umbralEstrella3: row.umbralEstrella3,
      limiteTiempo: row.limiteTiempo ?? undefined,
    });
  }

  private static celdasToPersistence(
    nivel: Nivel,
  ): Array<{ x: number; y: number; tipo: string; direccion: string | null }> {
    const result: Array<{
      x: number;
      y: number;
      tipo: string;
      direccion: string | null;
    }> = [];
    for (let y = 0; y < nivel.alto; y++) {
      for (let x = 0; x < nivel.ancho; x++) {
        const celda = nivel.definicionTablero.celdaEn(new Posicion(x, y));
        result.push({
          x,
          y,
          tipo: celda.tipo,
          direccion: celda.tipo === 'flecha' ? celda.direccion : null,
        });
      }
    }
    return result;
  }

  private static celdasMatrixFromRows(row: NivelPrismaRow): Celda[][] {
    const maxY = Math.max(...row.celdas.map((c) => c.y), 0);
    const maxX = Math.max(...row.celdas.map((c) => c.x), 0);

    const matrix: Celda[][] = Array.from({ length: maxY + 1 }, () =>
      Array.from({ length: maxX + 1 }, () =>
        FabricaCeldasEstandar.crearVacia(),
      ),
    );

    for (const celda of row.celdas) {
      switch (celda.tipo) {
        case 'flecha':
          matrix[celda.y][celda.x] = FabricaCeldasEstandar.crearFlecha(
            celda.direccion as Direccion,
          );
          break;
        case 'pared':
          matrix[celda.y][celda.x] = FabricaCeldasEstandar.crearPared();
          break;
        case 'vacia':
          matrix[celda.y][celda.x] = FabricaCeldasEstandar.crearVacia();
          break;
        case 'coleccionable':
          matrix[celda.y][celda.x] = FabricaCeldasEstandar.crearColeccionable();
          break;
      }
    }

    return matrix;
  }
}
