import { Direccion } from './direccion';

export interface CeldaFlecha {
  readonly tipo: 'flecha';
  readonly direccion: Direccion;
}

export interface CeldaPared {
  readonly tipo: 'pared';
}

export interface CeldaVacia {
  readonly tipo: 'vacia';
}

export interface Coleccionable {
  readonly tipo: 'coleccionable';
}

// A position inside the bounding box that is NOT part of the playable region (shaped
// boards). Distinct from CeldaVacia, which is present-but-transparent: an absent position
// behaves as if it does not exist — a ray reaching it has left the shape and exits.
export interface CeldaAusente {
  readonly tipo: 'ausente';
}

export type Celda =
  | CeldaFlecha
  | CeldaPared
  | CeldaVacia
  | Coleccionable
  | CeldaAusente;

// A board's cells can be given either as one 2D layer (Celda[][], rows=y, cols=x — the
// pre-ticket-19 2D shape) or as an explicit stack of layers indexed [z][y][x] (3D boards).
// Distinguishing the two only by array nesting (a Celda is never itself an array) lets
// every existing 2D call site keep passing a bare Celda[][] unchanged.
export function capasDesde(celdas: Celda[][] | Celda[][][]): Celda[][][] {
  const primeraFila = celdas[0];
  const esApilado = Array.isArray(primeraFila) && Array.isArray(primeraFila[0]);
  return esApilado ? (celdas as Celda[][][]) : [celdas as Celda[][]];
}

export class FabricaCeldasEstandar {
  static crearFlecha(direccion: Direccion): CeldaFlecha {
    return { tipo: 'flecha', direccion };
  }

  static crearPared(): CeldaPared {
    return { tipo: 'pared' };
  }

  static crearVacia(): CeldaVacia {
    return { tipo: 'vacia' };
  }

  static crearColeccionable(): Coleccionable {
    return { tipo: 'coleccionable' };
  }

  static crearAusente(): CeldaAusente {
    return { tipo: 'ausente' };
  }
}
