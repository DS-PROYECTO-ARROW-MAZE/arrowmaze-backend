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
    it('should_return_true_when_the_board_is_a_golden_solvable_board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.solvable);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('should_return_false_when_the_board_is_a_golden_unsolvable_board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.unsolvable);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('should_return_true_when_the_board_is_empty', () => {
      const tablero = new GrafoTablero(1, 1, [
        [FabricaCeldasEstandar.crearVacia()],
      ]);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('should_return_true_when_a_single_arrow_points_to_the_edge', () => {
      const tablero = new GrafoTablero(1, 1, [
        [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
      ]);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('should_return_false_when_arrows_block_each_other', () => {
      const tablero = new GrafoTablero(2, 1, [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearFlecha(Direccion.IZQUIERDA),
        ],
      ]);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('should_return_the_same_verdict_when_called_repeatedly_regardless_of_removal_order', () => {
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

    it('should_return_true_when_a_CeldaVacia_is_treated_as_transparent', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
        ],
      ];
      const tablero = new GrafoTablero(2, 1, celdas);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('should_return_false_when_the_ray_is_blocked_by_a_wall', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearPared(),
        ],
      ];
      const tablero = new GrafoTablero(2, 1, celdas);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('should_return_true_when_a_collectible_does_not_block_the_ray', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearColeccionable(),
        ],
      ];
      const tablero = new GrafoTablero(2, 1, celdas);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('should_return_true_when_solving_a_multi_step_chain', () => {
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

    it('should_return_true_when_the_ray_exits_at_an_absent_cell_ignoring_walls_beyond_the_mask', () => {
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

    it('should_return_false_when_empty_cells_stay_transparent_up_to_a_wall', () => {
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

    it('should_return_true_when_the_board_is_a_golden_solvable_triangle_board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.triangleSolvable);
      expect(esSolvable(tablero)).toBe(true);
    });

    it('should_return_false_when_the_board_is_a_golden_unsolvable_triangle_board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.triangleUnsolvable);
      expect(esSolvable(tablero)).toBe(false);
    });

    it('should_return_true_when_the_board_is_a_golden_solvable_heart_board', () => {
      const tablero = tableroDesdeGolden(goldenBoards.heartSolvable);
      expect(esSolvable(tablero)).toBe(true);
    });
  });
});
