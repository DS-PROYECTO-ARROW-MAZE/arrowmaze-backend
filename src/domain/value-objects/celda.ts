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
