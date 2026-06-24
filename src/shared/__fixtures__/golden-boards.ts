export type GoldenCelda =
  | { tipo: 'flecha'; direccion: string }
  | { tipo: 'pared' }
  | { tipo: 'vacia' }
  | { tipo: 'coleccionable' }
  // 'ausente' marks a grid position that is NOT part of the playable region (a shaped
  // board). It is distinct from 'vacia' (present-but-transparent): a ray reaching an
  // absent position has left the shape and exits, as if off the board.
  | { tipo: 'ausente' };

export interface GoldenBoard {
  ancho: number;
  alto: number;
  celdas: GoldenCelda[][];
}

const F = (direccion: string): GoldenCelda => ({ tipo: 'flecha', direccion });
const V: GoldenCelda = { tipo: 'vacia' };
const A: GoldenCelda = { tipo: 'ausente' };

// These fixtures are SHARED with the Dart frontend (arrowmaze-frontend ticket 16). Any
// change here must be mirrored there so both repos agree on the same golden verdicts.
export const goldenBoards = {
  // Minimal solvable board: the arrow travels through one cell before exiting (length 2),
  // satisfying the arrow-length >= 2 invariant.
  solvable: {
    ancho: 2,
    alto: 1,
    celdas: [[F('DERECHA'), V]],
  } satisfies GoldenBoard,

  unsolvable: {
    ancho: 2,
    alto: 1,
    celdas: [[F('DERECHA'), F('IZQUIERDA')]],
  } satisfies GoldenBoard,

  // Triangle-shaped playable region inside a 5x3 bounding box. The corners are absent.
  //   . . ↓ . .
  //   . _ _ _ .
  //   _ _ _ _ _
  // The single down arrow rides the central column to the bottom edge and exits.
  triangleSolvable: {
    ancho: 5,
    alto: 3,
    celdas: [
      [A, A, F('ABAJO'), A, A],
      [A, V, V, V, A],
      [V, V, V, V, V],
    ],
  } satisfies GoldenBoard,

  // Same triangle, but a second arrow at the bottom of the central column points back up,
  // so the two arrows block each other and neither can ever exit.
  triangleUnsolvable: {
    ancho: 5,
    alto: 3,
    celdas: [
      [A, A, F('ABAJO'), A, A],
      [A, V, V, V, A],
      [V, V, F('ARRIBA'), V, V],
    ],
  } satisfies GoldenBoard,

  // Heart-shaped playable region inside a 3x3 bounding box. The top notch and the bottom
  //   X _ X
  //   X ↓ X
  //   _ X _
  // corners are absent. The arrow exits downward through the bottom tip.
  heartSolvable: {
    ancho: 3,
    alto: 3,
    celdas: [
      [V, A, V],
      [V, F('ABAJO'), V],
      [A, V, A],
    ],
  } satisfies GoldenBoard,
};
