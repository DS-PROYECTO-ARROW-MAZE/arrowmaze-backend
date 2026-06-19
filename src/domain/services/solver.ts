import { Tablero } from './tablero';
import { Posicion } from '../value-objects/posicion';

export function esSolvable(tablero: Tablero): boolean {
  let actual = tablero;

  for (let y = 0; y < actual.alto; y++) {
    for (let x = 0; x < actual.ancho; x++) {
      const pos = new Posicion(x, y);
      const celda = actual.celdaEn(pos);
      if (celda.tipo !== 'flecha') continue;

      if (actual.esRayoLibre(pos, celda.direccion)) {
        actual = actual.conFlechaRemovida(pos);
        y = 0;
        x = -1;
      }
    }
  }

  for (let y = 0; y < actual.alto; y++) {
    for (let x = 0; x < actual.ancho; x++) {
      if (actual.celdaEn(new Posicion(x, y)).tipo === 'flecha') {
        return false;
      }
    }
  }
  return true;
}
