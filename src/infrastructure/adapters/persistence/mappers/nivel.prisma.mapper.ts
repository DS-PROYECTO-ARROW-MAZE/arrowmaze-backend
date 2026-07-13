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
      profundo: nivel.profundo,
      baseNivel: nivel.baseNivel,
      kmov: nivel.kmov,
      ktiempo: nivel.ktiempo,
      umbralEstrella1: nivel.umbralEstrella1,
      umbralEstrella2: nivel.umbralEstrella2,
      umbralEstrella3: nivel.umbralEstrella3,
      limiteTiempo: nivel.limiteTiempo ?? null,
      numero: nivel.numero,
      esBonus: nivel.esBonus,
      celdas: {
        create: this.celdasToPersistence(nivel),
      },
    };
  }

  static toUpdateArgs(nivel: Nivel): Prisma.NivelUpdateArgs {
    return {
      where: { id: nivel.id },
      data: {
        nombre: nivel.nombre,
        dificultad: nivel.dificultad,
        ancho: nivel.ancho,
        alto: nivel.alto,
        profundo: nivel.profundo,
        baseNivel: nivel.baseNivel,
        kmov: nivel.kmov,
        ktiempo: nivel.ktiempo,
        umbralEstrella1: nivel.umbralEstrella1,
        umbralEstrella2: nivel.umbralEstrella2,
        umbralEstrella3: nivel.umbralEstrella3,
        limiteTiempo: nivel.limiteTiempo ?? null,
        numero: nivel.numero,
        esBonus: nivel.esBonus,
        celdas: {
          deleteMany: {},
          create: this.celdasToPersistence(nivel),
        },
      },
    };
  }

  static toDomain(row: NivelPrismaRow): Nivel {
    // The column defaults to 1 in the DB, so every real row already carries a concrete
    // value; the `?? 1` only guards mocked/pre-migration row shapes in tests.
    const profundo = row.profundo ?? 1;
    const capas = this.capasCeldasFromRows(row, profundo);

    const definicionTablero = DefinicionTablero.restaurar(
      row.ancho,
      row.alto,
      capas,
      profundo,
    );

    return Nivel.crear({
      id: row.id,
      nombre: row.nombre,
      dificultad: row.dificultad,
      definicionTablero,
      ancho: row.ancho,
      alto: row.alto,
      profundo,
      baseNivel: row.baseNivel,
      kmov: row.kmov,
      ktiempo: row.ktiempo,
      umbralEstrella1: row.umbralEstrella1,
      umbralEstrella2: row.umbralEstrella2,
      umbralEstrella3: row.umbralEstrella3,
      limiteTiempo: row.limiteTiempo ?? undefined,
      numero: row.numero,
      esBonus: row.esBonus,
    });
  }

  private static celdasToPersistence(nivel: Nivel): Array<{
    x: number;
    y: number;
    z: number;
    tipo: string;
    direccion: string | null;
  }> {
    const result: Array<{
      x: number;
      y: number;
      z: number;
      tipo: string;
      direccion: string | null;
    }> = [];
    for (let z = 0; z < nivel.profundo; z++) {
      for (let y = 0; y < nivel.alto; y++) {
        for (let x = 0; x < nivel.ancho; x++) {
          const celda = nivel.definicionTablero.celdaEn(new Posicion(x, y, z));
          // Absent positions of a shaped board are stored as the absence of a row, never
          // as a filler cell — so a sparse board round-trips without inventing cells.
          if (celda.tipo === 'ausente') continue;
          result.push({
            x,
            y,
            z,
            tipo: celda.tipo,
            direccion: celda.tipo === 'flecha' ? celda.direccion : null,
          });
        }
      }
    }
    return result;
  }

  private static capasCeldasFromRows(
    row: NivelPrismaRow,
    profundo: number,
  ): Celda[][][] {
    // The grid spans the full ancho x alto x profundo volume. Positions with no persisted
    // row are absent (outside the playable shape), reconstructing the mask on load.
    const capas: Celda[][][] = Array.from({ length: profundo }, () =>
      Array.from({ length: row.alto }, () =>
        Array.from({ length: row.ancho }, () =>
          FabricaCeldasEstandar.crearAusente(),
        ),
      ),
    );

    for (const celda of row.celdas) {
      // The column defaults to 0 in the DB, so every real row already carries a concrete
      // value; the `?? 0` only guards mocked/pre-migration row shapes in tests.
      const z = celda.z ?? 0;
      switch (celda.tipo) {
        case 'flecha':
          capas[z][celda.y][celda.x] = FabricaCeldasEstandar.crearFlecha(
            celda.direccion as Direccion,
          );
          break;
        case 'pared':
          capas[z][celda.y][celda.x] = FabricaCeldasEstandar.crearPared();
          break;
        case 'vacia':
          capas[z][celda.y][celda.x] = FabricaCeldasEstandar.crearVacia();
          break;
        case 'coleccionable':
          capas[z][celda.y][celda.x] =
            FabricaCeldasEstandar.crearColeccionable();
          break;
      }
    }

    return capas;
  }
}
