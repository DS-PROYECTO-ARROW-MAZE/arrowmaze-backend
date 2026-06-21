import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { Nivel } from '../../domain/aggregates/nivel';
import { GrafoTablero } from '../../domain/services/grafo-tablero';
import { esSolvable } from '../../domain/services/solver';
import { NivelNoEncontradoException } from '../../domain/exceptions/nivel-no-encontrado.exception';
import { NivelNoSolvableException } from '../../domain/exceptions/nivel-no-solvable.exception';
import { Posicion } from '../../domain/value-objects/posicion';
import { Celda } from '../../domain/value-objects/celda';
import { DefinicionNivelDto } from '../dtos/definicion-nivel.dto';
import { CeldaDto } from '../dtos/crear-nivel.dto';

export class ObtenerNivelCasoDeUso {
  constructor(private readonly repositorioNivel: IRepositorioNivel) {}

  async execute(id: string): Promise<DefinicionNivelDto> {
    const nivel = await this.repositorioNivel.obtenerPorId(id);
    if (!nivel) {
      throw new NivelNoEncontradoException(id);
    }

    const matrizCeldas = this.extraerMatrizCeldas(nivel);
    const tablero = new GrafoTablero(nivel.ancho, nivel.alto, matrizCeldas);
    if (!esSolvable(tablero)) {
      throw new NivelNoSolvableException();
    }

    return this.mapearADto(nivel);
  }

  private extraerMatrizCeldas(nivel: Nivel): Celda[][] {
    const resultado: Celda[][] = [];
    for (let y = 0; y < nivel.alto; y++) {
      const fila: Celda[] = [];
      for (let x = 0; x < nivel.ancho; x++) {
        fila.push(nivel.definicionTablero.celdaEn(new Posicion(x, y)));
      }
      resultado.push(fila);
    }
    return resultado;
  }

  private mapearADto(nivel: Nivel): DefinicionNivelDto {
    return {
      id: nivel.id,
      nombre: nivel.nombre,
      dificultad: nivel.dificultad,
      ancho: nivel.ancho,
      alto: nivel.alto,
      celdas: this.mapearCeldasADto(nivel),
      baseNivel: nivel.baseNivel,
      kmov: nivel.kmov,
      ktiempo: nivel.ktiempo,
      umbralEstrella1: nivel.umbralEstrella1,
      umbralEstrella2: nivel.umbralEstrella2,
      umbralEstrella3: nivel.umbralEstrella3,
      limiteTiempo: nivel.limiteTiempo,
    };
  }

  private mapearCeldasADto(nivel: Nivel): CeldaDto[][] {
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
