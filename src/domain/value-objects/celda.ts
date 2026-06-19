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

export type Celda = CeldaFlecha | CeldaPared | CeldaVacia | Coleccionable;

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
}
