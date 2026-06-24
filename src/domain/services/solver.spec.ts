import { GrafoTablero } from './grafo-tablero';
import { FabricaCeldasEstandar } from '../value-objects/celda';
import { Direccion } from '../value-objects/direccion';
import { esSolvable } from './solver';
import {
  goldenBoards,
  GoldenBoard,
} from '../../shared/__fixtures__/golden-boards';

function tableroDesdeGolden(golden: GoldenBoard): GrafoTablero {
  const celdas = golden.celdas.map((fila) =>
    fila.map((gc) => {
      switch (gc.tipo) {
        case 'flecha':
          return FabricaCeldasEstandar.crearFlecha(gc.direccion as Direccion);
        case 'pared':
          return FabricaCeldasEstandar.crearPared();
        case 'vacia':
          return FabricaCeldasEstandar.crearVacia();
        case 'coleccionable':
          return FabricaCeldasEstandar.crearColeccionable();
        case 'ausente':
          return FabricaCeldasEstandar.crearAusente();
      }
    }),
  );
  return new GrafoTablero(golden.ancho, golden.alto, celdas);
}

describe('Solver', () => {
  describe('esSolvable', () => {
    it('returns true for a golden solvable board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.solvable);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('returns false for a golden unsolvable board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.unsolvable);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('returns true for an empty board', () => {
      const tablero = new GrafoTablero(1, 1, [
        [FabricaCeldasEstandar.crearVacia()],
      ]);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('removes a single arrow pointing to the edge', () => {
      const tablero = new GrafoTablero(1, 1, [
        [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
      ]);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('detects unsolvable when arrows block each other', () => {
      const tablero = new GrafoTablero(2, 1, [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearFlecha(Direccion.IZQUIERDA),
        ],
      ]);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('is order-independent: returns same verdict regardless of removal order', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
        ],
      ];
      const tablero = new GrafoTablero(3, 1, celdas);
      for (let i = 0; i < 10; i++) {
        expect(esSolvable(tablero)).toBe(true);
      }
    });

    it('treats CeldaVacia as transparent', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
        ],
      ];
      const tablero = new GrafoTablero(2, 1, celdas);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('ray passes through empty but not through walls', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearPared(),
        ],
      ];
      const tablero = new GrafoTablero(2, 1, celdas);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('collectible does not block the ray', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearColeccionable(),
        ],
      ];
      const tablero = new GrafoTablero(2, 1, celdas);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('solves a multi-step chain', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
        ],
      ];
      const tablero = new GrafoTablero(3, 1, celdas);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('ray exits when it reaches an absent cell, ignoring walls beyond the mask', () => {
      // flecha -> vacia -> ausente -> pared. The ray leaves the playable region at the
      // absent cell before it can reach the wall, so the arrow exits and the board solves.
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
          FabricaCeldasEstandar.crearAusente(),
          FabricaCeldasEstandar.crearPared(),
        ],
      ];
      const tablero = new GrafoTablero(4, 1, celdas);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('treats absent differently from empty: empty stays transparent up to a wall', () => {
      // Same layout but the third cell is empty (transparent) instead of absent, so the
      // ray keeps going and is blocked by the wall: unsolvable.
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
          FabricaCeldasEstandar.crearVacia(),
          FabricaCeldasEstandar.crearPared(),
        ],
      ];
      const tablero = new GrafoTablero(4, 1, celdas);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('returns true for a golden solvable triangle board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.triangleSolvable);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('returns false for a golden unsolvable triangle board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.triangleUnsolvable);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('returns true for a golden solvable heart board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.heartSolvable);
      expect(esSolvable(tablero)).toBe(true);
    });
  });
});
