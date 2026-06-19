import { DefinicionTablero } from './definicion-tablero';
import { FabricaCeldasEstandar } from './celda';
import { Direccion } from './direccion';
import { Posicion } from './posicion';

describe('DefinicionTablero', () => {
  describe('crear', () => {
    it('returns a frozen DefinicionTablero', () => {
      const celdas = [[FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)]];
      const dt = DefinicionTablero.crear(1, 1, celdas);
      expect(dt).toBeInstanceOf(DefinicionTablero);
      expect(dt.ancho).toBe(1);
      expect(dt.alto).toBe(1);
      expect(dt.celdaEn(new Posicion(0, 0)).tipo).toBe('flecha');
    });

    it('preserves celda types through the round-trip', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.ABAJO),
          FabricaCeldasEstandar.crearPared(),
          FabricaCeldasEstandar.crearVacia(),
          FabricaCeldasEstandar.crearColeccionable(),
        ],
      ];
      const dt = DefinicionTablero.crear(4, 1, celdas);
      expect(dt.celdaEn(new Posicion(0, 0)).tipo).toBe('flecha');
      expect(dt.celdaEn(new Posicion(1, 0)).tipo).toBe('pared');
      expect(dt.celdaEn(new Posicion(2, 0)).tipo).toBe('vacia');
      expect(dt.celdaEn(new Posicion(3, 0)).tipo).toBe('coleccionable');
    });
  });

  describe('restaurar', () => {
    it('returns a frozen DefinicionTablero without solvability check', () => {
      const celdas = [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearFlecha(Direccion.IZQUIERDA),
        ],
      ];
      const dt = DefinicionTablero.restaurar(2, 1, celdas);
      expect(dt).toBeInstanceOf(DefinicionTablero);
      expect(dt.celdaEn(new Posicion(0, 0)).tipo).toBe('flecha');
      expect(dt.celdaEn(new Posicion(1, 0)).tipo).toBe('flecha');
    });
  });
});
