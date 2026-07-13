import { Tablero } from './tablero';
import { Posicion } from '../value-objects/posicion';

export function esSolvable(tablero: Tablero): boolean {
  let actual = tablero;

  for (let z = 0; z < actual.profundo; z++) {
    for (let y = 0; y < actual.alto; y++) {
      for (let x = 0; x < actual.ancho; x++) {
        const pos = new Posicion(x, y, z);
        const celda = actual.celdaEn(pos);
        if (celda.tipo !== 'flecha') continue;

        if (actual.esRayoLibre(pos, celda.direccion)) {
          actual = actual.conFlechaRemovida(pos);
          z = 0;
          y = 0;
          x = -1;
        }
      }
    }
  }

  for (let z = 0; z < actual.profundo; z++) {
    for (let y = 0; y < actual.alto; y++) {
      for (let x = 0; x < actual.ancho; x++) {
        if (actual.celdaEn(new Posicion(x, y, z)).tipo === 'flecha') {
          return false;
        }
      }
    }
  }
  return true;
}
