import { Celda, FabricaCeldasEstandar } from './celda';
import { Posicion } from './posicion';

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
}
