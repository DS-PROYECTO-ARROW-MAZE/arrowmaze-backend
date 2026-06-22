export enum Direccion {
  ARRIBA = 'ARRIBA',
  ABAJO = 'ABAJO',
  IZQUIERDA = 'IZQUIERDA',
  DERECHA = 'DERECHA',
}

// Unit step (in grid coordinates) that a ray advances per cell for each direction.
// Shared by the solver (raycasting/edge detection) and the arrow-length invariant so
// "which way does a flecha travel" is defined in exactly one place.
export function deltaDireccion(direccion: Direccion): { x: number; y: number } {
  switch (direccion) {
    case Direccion.ARRIBA:
      return { x: 0, y: -1 };
    case Direccion.ABAJO:
      return { x: 0, y: 1 };
    case Direccion.IZQUIERDA:
      return { x: -1, y: 0 };
    case Direccion.DERECHA:
      return { x: 1, y: 0 };
  }
}
