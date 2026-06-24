import { Celda, FabricaCeldasEstandar } from './celda';
import { Direccion, deltaDireccion } from './direccion';
import { Posicion } from './posicion';
import { FlechaLongitudInvalidaException } from '../exceptions/flecha-longitud-invalida.exception';

// Minimum number of cells an arrow's path may span. A length-1 arrow is degenerate: it
// exits the playable region on its first step without ever moving through it.
export const LONGITUD_MINIMA_FLECHA = 2;

export class DefinicionTablero {
  private readonly celdas: ReadonlyArray<ReadonlyArray<Celda>>;

  private constructor(
    public readonly ancho: number,
    public readonly alto: number,
    celdas: Celda[][],
  ) {
    this.celdas = Object.freeze(celdas.map((row) => Object.freeze([...row])));
  }

  static crear(
    ancho: number,
    alto: number,
    celdas: Celda[][],
  ): DefinicionTablero {
    DefinicionTablero.validarLongitudFlechas(ancho, alto, celdas);
    return new DefinicionTablero(ancho, alto, celdas);
  }

  static restaurar(
    ancho: number,
    alto: number,
    celdas: Celda[][],
  ): DefinicionTablero {
    return new DefinicionTablero(ancho, alto, celdas);
  }

  celdaEn(pos: Posicion): Celda {
    const fila = this.celdas[pos.y];
    if (!fila) return FabricaCeldasEstandar.crearVacia();
    return fila[pos.x] ?? FabricaCeldasEstandar.crearVacia();
  }

  // Every arrow's ray must traverse at least LONGITUD_MINIMA_FLECHA playable cells
  // (origin included) before it leaves the shape — out of the bounding box or onto an
  // absent position. Anything shorter is a single-cell move and is rejected.
  private static validarLongitudFlechas(
    ancho: number,
    alto: number,
    celdas: Celda[][],
  ): void {
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        const celda = celdas[y]?.[x];
        if (!celda || celda.tipo !== 'flecha') continue;
        if (
          DefinicionTablero.longitudRayo(
            ancho,
            alto,
            celdas,
            x,
            y,
            celda.direccion,
          ) < LONGITUD_MINIMA_FLECHA
        ) {
          throw new FlechaLongitudInvalidaException();
        }
      }
    }
  }

  private static longitudRayo(
    ancho: number,
    alto: number,
    celdas: Celda[][],
    x: number,
    y: number,
    direccion: Direccion,
  ): number {
    const delta = deltaDireccion(direccion);
    let longitud = 1;
    let nx = x + delta.x;
    let ny = y + delta.y;
    while (nx >= 0 && nx < ancho && ny >= 0 && ny < alto) {
      const celda = celdas[ny]?.[nx];
      if (!celda || celda.tipo === 'ausente') break;
      longitud++;
      nx += delta.x;
      ny += delta.y;
    }
    return longitud;
  }
}
