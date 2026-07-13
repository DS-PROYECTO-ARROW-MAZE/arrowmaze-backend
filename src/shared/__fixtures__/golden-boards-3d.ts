export type GoldenCelda3D =
  | { tipo: 'flecha'; direccion: string }
  | { tipo: 'pared' }
  | { tipo: 'vacia' }
  | { tipo: 'coleccionable' }
  // 'ausente' marks a grid position that is NOT part of the playable region — see
  // golden-boards.ts. Distinct from 'vacia' (present-but-transparent).
  | { tipo: 'ausente' };

export interface GoldenBoard3D {
  ancho: number;
  alto: number;
  profundo: number;
  // Indexed [z][y][x] — one 2D golden-board layer (see golden-boards.ts) per z ("capa").
  capas: GoldenCelda3D[][][];
}

const F = (direccion: string): GoldenCelda3D => ({ tipo: 'flecha', direccion });
const V: GoldenCelda3D = { tipo: 'vacia' };

// Fixtures for arrowmaze-backend ticket 19 (3D board geometry — depth axis). SHARED with the
// Dart frontend (arrowmaze-frontend ticket 36). Any change here must be mirrored there so both
// repos agree on the same golden verdicts.
//
// NOTE: unlike the frontend's Trayectoria (a multi-cell path sharing one head direction), the
// backend's Celda model has no path/id grouping — every 'flecha' cell is its own independent
// single-cell arrow with its own direccion (see ../../domain/value-objects/celda.ts). These
// fixtures are the backend-model equivalent of the frontend's three 3D test boards, not a
// byte-for-byte mirror; only the minimal smoke test and the unsolvable case are structurally
// identical across repos.
export const goldenBoards3D = {
  // Depth-axis smoke test: 1x1 footprint, 2 layers. The single arrow travels one cell forward
  // in depth before exiting the stack — the z-axis analogue of golden-boards.ts's `solvable`
  // (which does the same thing along x).
  minimalSolvable3D: {
    ancho: 1,
    alto: 1,
    profundo: 2,
    capas: [
      [[F('ADELANTE')]], // z=0
      [[V]], // z=1
    ],
  } satisfies GoldenBoard3D,

  // Two independent arrows in different layers: the lower one's ray is initially blocked by
  // the upper one; the upper one's own ray is immediately clear, so removing it first unblocks
  // the lower one. Proves the solver's greedy order-independence holds across the depth axis,
  // not just within a single layer.
  crossLayerDependencySolvable3D: {
    ancho: 2,
    alto: 1,
    profundo: 2,
    capas: [
      [[F('ADELANTE'), V]], // z=0: blocked until the z=1 arrow clears; empty neighbour
      [[F('DERECHA'), V]], // z=1: independently clear; empty neighbour
    ],
  } satisfies GoldenBoard3D,

  // Two single-cell arrows pointing at each other along the depth axis — the z-axis analogue
  // of golden-boards.ts's `unsolvable` (which does the same along x). Each individually
  // satisfies the length->=2 invariant (its ray reaches the far layer before leaving the
  // board) but they block each other forever.
  depthAxisUnsolvable3D: {
    ancho: 1,
    alto: 1,
    profundo: 2,
    capas: [
      [[F('ADELANTE')]], // z=0
      [[F('ATRAS')]], // z=1
    ],
  } satisfies GoldenBoard3D,
};
