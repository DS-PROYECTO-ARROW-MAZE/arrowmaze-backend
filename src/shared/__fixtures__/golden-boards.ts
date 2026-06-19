export type GoldenCelda =
  | { tipo: 'flecha'; direccion: string }
  | { tipo: 'pared' }
  | { tipo: 'vacia' }
  | { tipo: 'coleccionable' };

export interface GoldenBoard {
  ancho: number;
  alto: number;
  celdas: GoldenCelda[][];
}

export const goldenBoards = {
  solvable: {
    ancho: 1,
    alto: 1,
    celdas: [[{ tipo: 'flecha', direccion: 'DERECHA' }]],
  } satisfies GoldenBoard,

  unsolvable: {
    ancho: 2,
    alto: 1,
    celdas: [
      [
        { tipo: 'flecha', direccion: 'DERECHA' },
        { tipo: 'flecha', direccion: 'IZQUIERDA' },
      ],
    ],
  } satisfies GoldenBoard,
};
