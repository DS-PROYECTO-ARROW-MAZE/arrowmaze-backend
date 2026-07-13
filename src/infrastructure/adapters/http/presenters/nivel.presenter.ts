import { Nivel } from '../../../../domain/aggregates/nivel';
import { Posicion } from '../../../../domain/value-objects/posicion';
import { CeldaDto } from '../../../../application/dtos/crear-nivel.dto';
import { DefinicionNivelDto } from '../../../../application/dtos/definicion-nivel.dto';

export class NivelPresenter {
  static toDto(nivel: Nivel): DefinicionNivelDto {
    return {
      id: nivel.id,
      nombre: nivel.nombre,
      dificultad: nivel.dificultad,
      ancho: nivel.ancho,
      alto: nivel.alto,
      profundo: nivel.profundo,
      celdas: this.celdasADto(nivel),
      baseNivel: nivel.baseNivel,
      kmov: nivel.kmov,
      ktiempo: nivel.ktiempo,
      umbralEstrella1: nivel.umbralEstrella1,
      umbralEstrella2: nivel.umbralEstrella2,
      umbralEstrella3: nivel.umbralEstrella3,
      limiteTiempo: nivel.limiteTiempo,
    };
  }

  // Walks z/y/x and returns the bare 2D [y][x] shape when profundo is 1 (every
  // pre-ticket-19 level), or the layered [z][y][x] shape otherwise.
  private static celdasADto(nivel: Nivel): CeldaDto[][] | CeldaDto[][][] {
    const capas: CeldaDto[][][] = [];
    for (let z = 0; z < nivel.profundo; z++) {
      const fila2D: CeldaDto[][] = [];
      for (let y = 0; y < nivel.alto; y++) {
        const fila: CeldaDto[] = [];
        for (let x = 0; x < nivel.ancho; x++) {
          const celda = nivel.definicionTablero.celdaEn(new Posicion(x, y, z));
          fila.push({
            tipo: celda.tipo,
            ...(celda.tipo === 'flecha' ? { direccion: celda.direccion } : {}),
          });
        }
        fila2D.push(fila);
      }
      capas.push(fila2D);
    }
    return nivel.profundo === 1 ? capas[0] : capas;
  }
}
