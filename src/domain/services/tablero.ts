import { Posicion } from '../value-objects/posicion';
import { Direccion } from '../value-objects/direccion';
import { Celda } from '../value-objects/celda';

export interface Tablero {
  readonly ancho: number;
  readonly alto: number;

  celdaEn(pos: Posicion): Celda;

  esRayoLibre(origen: Posicion, direccion: Direccion): boolean;

  conFlechaRemovida(pos: Posicion): Tablero;
}
