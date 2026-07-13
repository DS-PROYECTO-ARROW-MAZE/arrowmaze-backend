import { Celda, FabricaCeldasEstandar, capasDesde } from './celda';
import { Direccion, deltaDireccion } from './direccion';
import { Posicion } from './posicion';
import { FlechaLongitudInvalidaException } from '../exceptions/flecha-longitud-invalida.exception';

// Minimum number of cells an arrow's path may span. A length-1 arrow is degenerate: it
// exits the playable region on its first step without ever moving through it.
export const LONGITUD_MINIMA_FLECHA = 2;

export class DefinicionTablero {
  private readonly capas: ReadonlyArray<ReadonlyArray<ReadonlyArray<Celda>>>;

  private constructor(
    public readonly ancho: number,
    public readonly alto: number,
    public readonly profundo: number,
    capas: Celda[][][],
  ) {
    this.capas = Object.freeze(
      capas.map((capa) =>
        Object.freeze(capa.map((fila) => Object.freeze([...fila]))),
      ),
    );
  }

  static crear(
    ancho: number,
    alto: number,
    celdas: Celda[][] | Celda[][][],
    profundo: number = 1,
  ): DefinicionTablero {
    const capas = capasDesde(celdas);
    DefinicionTablero.validarLongitudFlechas(ancho, alto, profundo, capas);
    return new DefinicionTablero(ancho, alto, profundo, capas);
  }

  static restaurar(
    ancho: number,
    alto: number,
    celdas: Celda[][] | Celda[][][],
    profundo: number = 1,
  ): DefinicionTablero {
    return new DefinicionTablero(ancho, alto, profundo, capasDesde(celdas));
  }

  celdaEn(pos: Posicion): Celda {
    const capa = this.capas[pos.z];
    if (!capa) return FabricaCeldasEstandar.crearVacia();
    const fila = capa[pos.y];
    if (!fila) return FabricaCeldasEstandar.crearVacia();
    return fila[pos.x] ?? FabricaCeldasEstandar.crearVacia();
  }

  // Every arrow's ray must traverse at least LONGITUD_MINIMA_FLECHA playable cells
  // (origin included) before it leaves the shape — out of the bounding box/stack, or onto
  // an absent position. Anything shorter is a single-cell move and is rejected. Walks all
  // six directions identically via deltaDireccion's shared table, so the depth axis needs
  // no separate branch.
  private static validarLongitudFlechas(
    ancho: number,
    alto: number,
    profundo: number,
    capas: Celda[][][],
  ): void {
    for (let z = 0; z < profundo; z++) {
      for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
          const celda = capas[z]?.[y]?.[x];
          if (!celda || celda.tipo !== 'flecha') continue;
          if (
            DefinicionTablero.longitudRayo(
              ancho,
              alto,
              profundo,
              capas,
              x,
              y,
              z,
              celda.direccion,
            ) < LONGITUD_MINIMA_FLECHA
          ) {
            throw new FlechaLongitudInvalidaException();
          }
        }
      }
    }
  }

  private static longitudRayo(
    ancho: number,
    alto: number,
    profundo: number,
    capas: Celda[][][],
    x: number,
    y: number,
    z: number,
    direccion: Direccion,
  ): number {
    const delta = deltaDireccion(direccion);
    let longitud = 1;
    let nx = x + delta.x;
    let ny = y + delta.y;
    let nz = z + delta.z;
    while (
      nx >= 0 &&
      nx < ancho &&
      ny >= 0 &&
      ny < alto &&
      nz >= 0 &&
      nz < profundo
    ) {
      const celda = capas[nz]?.[ny]?.[nx];
      if (!celda || celda.tipo === 'ausente') break;
      longitud++;
      nx += delta.x;
      ny += delta.y;
      nz += delta.z;
    }
    return longitud;
  }
}
