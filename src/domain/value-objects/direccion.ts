export enum Direccion {
  ARRIBA = 'ARRIBA',
  ABAJO = 'ABAJO',
  IZQUIERDA = 'IZQUIERDA',
  DERECHA = 'DERECHA',
  ADELANTE = 'ADELANTE',
  ATRAS = 'ATRAS',
}

export interface PasoDireccion {
  x: number;
  y: number;
  z: number;
}

// Unit step (in grid coordinates) that a ray advances per cell for each direction. One
// table drives every direction-aware consumer (the arrow-length invariant and the
// solver's raycast/edge detection), so the depth axis (ADELANTE/ATRAS) is additive
// rather than a parallel x/y-only code path.
const PASOS: Record<Direccion, PasoDireccion> = {
  [Direccion.ARRIBA]: { x: 0, y: -1, z: 0 },
  [Direccion.ABAJO]: { x: 0, y: 1, z: 0 },
  [Direccion.IZQUIERDA]: { x: -1, y: 0, z: 0 },
  [Direccion.DERECHA]: { x: 1, y: 0, z: 0 },
  [Direccion.ADELANTE]: { x: 0, y: 0, z: 1 },
  [Direccion.ATRAS]: { x: 0, y: 0, z: -1 },
};

export function deltaDireccion(direccion: Direccion): PasoDireccion {
  return PASOS[direccion];
}
