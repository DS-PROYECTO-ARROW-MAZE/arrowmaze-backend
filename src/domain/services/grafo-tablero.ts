import { Posicion } from '../value-objects/posicion';
import { Direccion, deltaDireccion } from '../value-objects/direccion';
import {
  Celda,
  FabricaCeldasEstandar,
  capasDesde,
} from '../value-objects/celda';
import { Tablero } from './tablero';

export class GrafoTablero implements Tablero {
  private readonly capas: Celda[][][];

  constructor(
    public readonly ancho: number,
    public readonly alto: number,
    celdas: Celda[][] | Celda[][][],
    public readonly profundo: number = 1,
  ) {
    this.capas = capasDesde(celdas).map((capa) =>
      capa.map((fila) => [...fila]),
    );
  }

  celdaEn(pos: Posicion): Celda {
    const capa = this.capas[pos.z];
    if (!capa) return FabricaCeldasEstandar.crearVacia();
    const fila = capa[pos.y];
    if (!fila) return FabricaCeldasEstandar.crearVacia();
    return fila[pos.x] ?? FabricaCeldasEstandar.crearVacia();
  }

  esRayoLibre(origen: Posicion, direccion: Direccion): boolean {
    const delta = deltaDireccion(direccion);
    let x = origen.x + delta.x;
    let y = origen.y + delta.y;
    let z = origen.z + delta.z;

    while (
      x >= 0 &&
      x < this.ancho &&
      y >= 0 &&
      y < this.alto &&
      z >= 0 &&
      z < this.profundo
    ) {
      const celda = this.capas[z]?.[y]?.[x];
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
      z += delta.z;
    }
    return true;
  }

  conFlechaRemovida(pos: Posicion): Tablero {
    const nuevasCapas = this.capas.map((capa) => capa.map((fila) => [...fila]));
    nuevasCapas[pos.z][pos.y][pos.x] = FabricaCeldasEstandar.crearVacia();
    return new GrafoTablero(this.ancho, this.alto, nuevasCapas, this.profundo);
  }
}
