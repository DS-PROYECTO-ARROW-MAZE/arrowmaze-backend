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

  private static celdasADto(nivel: Nivel): CeldaDto[][] {
    const resultado: CeldaDto[][] = [];
    for (let y = 0; y < nivel.alto; y++) {
      const fila: CeldaDto[] = [];
      for (let x = 0; x < nivel.ancho; x++) {
        const celda = nivel.definicionTablero.celdaEn(new Posicion(x, y));
        fila.push({
          tipo: celda.tipo,
          ...(celda.tipo === 'flecha' ? { direccion: celda.direccion } : {}),
        });
      }
      resultado.push(fila);
    }
    return resultado;
  }
}
