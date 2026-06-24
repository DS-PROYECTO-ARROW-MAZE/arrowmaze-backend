import { Posicion } from '../value-objects/posicion';
import { Direccion, deltaDireccion } from '../value-objects/direccion';
import { Celda, FabricaCeldasEstandar } from '../value-objects/celda';
import { Tablero } from './tablero';

export class GrafoTablero implements Tablero {
  private readonly celdas: Celda[][];

  constructor(
    public readonly ancho: number,
    public readonly alto: number,
    celdas: Celda[][],
  ) {
    this.celdas = celdas.map((row) => [...row]);
  }

  celdaEn(pos: Posicion): Celda {
    const fila = this.celdas[pos.y];
    if (!fila) return FabricaCeldasEstandar.crearVacia();
    return fila[pos.x] ?? FabricaCeldasEstandar.crearVacia();
  }

  esRayoLibre(origen: Posicion, direccion: Direccion): boolean {
    const delta = deltaDireccion(direccion);
    let x = origen.x + delta.x;
    let y = origen.y + delta.y;

    while (x >= 0 && x < this.ancho && y >= 0 && y < this.alto) {
      const celda = this.celdas[y][x];
      // An absent position is not part of the shape: reaching it means the ray has left
      // the playable region (an interior edge), so the arrow exits cleanly.
      if (!celda || celda.tipo === 'ausente') {
        return true;
      }
      if (celda.tipo === 'pared' || celda.tipo === 'flecha') {
        return false;
      }
      x += delta.x;
      y += delta.y;
    }
    return true;
  }

  conFlechaRemovida(pos: Posicion): Tablero {
    const nuevasCeldas = this.celdas.map((row) => [...row]);
    nuevasCeldas[pos.y][pos.x] = FabricaCeldasEstandar.crearVacia();
    return new GrafoTablero(this.ancho, this.alto, nuevasCeldas);
  }
}
