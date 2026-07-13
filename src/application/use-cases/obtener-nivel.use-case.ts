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

    const capasCeldas = this.extraerCapasCeldas(nivel);
    const tablero = new GrafoTablero(
      nivel.ancho,
      nivel.alto,
      capasCeldas,
      nivel.profundo,
    );
    if (!esSolvable(tablero)) {
      throw new NivelNoSolvableException();
    }

    return this.mapearADto(nivel);
  }

  private extraerCapasCeldas(nivel: Nivel): Celda[][][] {
    const capas: Celda[][][] = [];
    for (let z = 0; z < nivel.profundo; z++) {
      const fila2D: Celda[][] = [];
      for (let y = 0; y < nivel.alto; y++) {
        const fila: Celda[] = [];
        for (let x = 0; x < nivel.ancho; x++) {
          fila.push(nivel.definicionTablero.celdaEn(new Posicion(x, y, z)));
        }
        fila2D.push(fila);
      }
      capas.push(fila2D);
    }
    return capas;
  }

  private mapearADto(nivel: Nivel): DefinicionNivelDto {
    return {
      id: nivel.id,
      nombre: nivel.nombre,
      dificultad: nivel.dificultad,
      ancho: nivel.ancho,
      alto: nivel.alto,
      profundo: nivel.profundo,
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

  // Walks z/y/x and returns the bare 2D [y][x] shape when profundo is 1 (every
  // pre-ticket-19 level), or the layered [z][y][x] shape otherwise.
  private mapearCeldasADto(nivel: Nivel): CeldaDto[][] | CeldaDto[][][] {
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
