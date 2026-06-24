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
    it('returns a frozen DefinicionTablero', () => {
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

    it('preserves celda types through the round-trip', () => {
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

    it('throws FlechaLongitudInvalidaException when an arrow resolves to a single cell', () => {
      const celdas = [[FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)]];
      expect(() => DefinicionTablero.crear(1, 1, celdas)).toThrow(
        FlechaLongitudInvalidaException,
      );
    });

    it('throws when an arrow points straight off the bounding box edge', () => {
      // Arrow on the top row pointing up: its very first step leaves the board.
      const celdas = [
        [FabricaCeldasEstandar.crearFlecha(Direccion.ARRIBA)],
        [FabricaCeldasEstandar.crearVacia()],
      ];
      expect(() => DefinicionTablero.crear(1, 2, celdas)).toThrow(
        FlechaLongitudInvalidaException,
      );
    });

    it('throws when the cell in front of an arrow is absent (shape edge)', () => {
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

    it('accepts an arrow whose path is exactly the minimum length (floor is inclusive of 2)', () => {
      expect(LONGITUD_MINIMA_FLECHA).toBe(2);
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearVacia(),
        ],
      ];
      expect(() => DefinicionTablero.crear(2, 1, celdas)).not.toThrow();
    });

    it('accepts arrows longer than the minimum', () => {
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
    it('returns a frozen DefinicionTablero without the arrow-length check', () => {
      // restaurar trusts already-persisted data, so it does not re-enforce the invariant.
      const celdas = [[FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)]];
      const dt = DefinicionTablero.restaurar(1, 1, celdas);
      expect(dt).toBeInstanceOf(DefinicionTablero);
      expect(dt.celdaEn(new Posicion(0, 0)).tipo).toBe('flecha');
    });
  });
});
