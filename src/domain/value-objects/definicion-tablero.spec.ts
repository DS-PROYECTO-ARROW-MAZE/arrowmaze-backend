import {
  DefinicionTablero,
  LONGITUD_MINIMA_FLECHA,
} from './definicion-tablero';
import { FabricaCeldasEstandar } from './celda';
import { Direccion } from './direccion';
import { Posicion } from './posicion';
import { FlechaLongitudInvalidaException } from '../exceptions/flecha-longitud-invalida.exception';

describe('DefinicionTablero', () => {
  describe('crear', () => {
    it('should_return_a_frozen_DefinicionTablero_when_crear_is_called', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
        ],
      ];
      const dt = DefinicionTablero.crear(2, 1, celdas);
      expect(dt).toBeInstanceOf(DefinicionTablero);
      expect(dt.ancho).toBe(2);
      expect(dt.alto).toBe(1);
      expect(dt.celdaEn(new Posicion(0, 0)).tipo).toBe('flecha');
    });

    it('should_preserve_celda_types_when_round_tripping_through_crear', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
          FabricaCeldasEstandar.crearPared(),
          FabricaCeldasEstandar.crearColeccionable(),
        ],
      ];
      const dt = DefinicionTablero.crear(4, 1, celdas);
      expect(dt.celdaEn(new Posicion(0, 0)).tipo).toBe('flecha');
      expect(dt.celdaEn(new Posicion(1, 0)).tipo).toBe('vacia');
      expect(dt.celdaEn(new Posicion(2, 0)).tipo).toBe('pared');
      expect(dt.celdaEn(new Posicion(3, 0)).tipo).toBe('coleccionable');
    });

    it('should_throw_FlechaLongitudInvalidaException_when_an_arrow_resolves_to_a_single_cell', () => {
      const celdas = [[FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)]];
      expect(() => DefinicionTablero.crear(1, 1, celdas)).toThrow(
        FlechaLongitudInvalidaException,
      );
    });

    it('should_throw_when_an_arrow_points_straight_off_the_bounding_box_edge', () => {
      // Arrow on the top row pointing up: its very first step leaves the board.
      const celdas = [
        [FabricaCeldasEstandar.crearFlecha(Direccion.ARRIBA)],
        [FabricaCeldasEstandar.crearVacia()],
      ];
      expect(() => DefinicionTablero.crear(1, 2, celdas)).toThrow(
        FlechaLongitudInvalidaException,
      );
    });

    it('should_throw_when_the_cell_in_front_of_an_arrow_is_absent_shape_edge', () => {
      // Arrow points right but the next position is outside the playable shape.
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearAusente(),
        ],
      ];
      expect(() => DefinicionTablero.crear(2, 1, celdas)).toThrow(
        FlechaLongitudInvalidaException,
      );
    });

    it('should_accept_an_arrow_when_its_path_is_exactly_the_minimum_length', () => {
      expect(LONGITUD_MINIMA_FLECHA).toBe(2);
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
        ],
      ];
      expect(() => DefinicionTablero.crear(2, 1, celdas)).not.toThrow();
    });

    it('should_accept_an_arrow_when_its_path_is_longer_than_the_minimum', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
          FabricaCeldasEstandar.crearVacia(),
        ],
      ];
      expect(() => DefinicionTablero.crear(3, 1, celdas)).not.toThrow();
    });
  });

  describe('restaurar', () => {
    it('should_return_a_frozen_DefinicionTablero_without_the_arrow_length_check_when_restaurar_is_called', () => {
      // restaurar trusts already-persisted data, so it does not re-enforce the invariant.
      const celdas = [[FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)]];
      const dt = DefinicionTablero.restaurar(1, 1, celdas);
      expect(dt).toBeInstanceOf(DefinicionTablero);
      expect(dt.celdaEn(new Posicion(0, 0)).tipo).toBe('flecha');
    });
  });
});
