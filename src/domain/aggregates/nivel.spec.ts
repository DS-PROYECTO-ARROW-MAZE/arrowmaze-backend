import { Nivel } from './nivel';
import { DefinicionTablero } from '../value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../value-objects/celda';
import { Direccion } from '../value-objects/direccion';
import { ReglaTiempoNivelException } from '../exceptions/regla-tiempo-nivel.exception';

describe('Nivel', () => {
  const celdasSolvable = [
    [
      FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
      FabricaCeldasEstandar.crearVacia(),
    ],
  ];
  const definicion = DefinicionTablero.crear(2, 1, celdasSolvable);

  it('creates a Nivel with valid data', () => {
    const nivel = Nivel.crear({
      id: 'nivel-test',
      nombre: 'Test Level',
      dificultad: 'FACIL',
      definicionTablero: definicion,
      ancho: 1,
      alto: 1,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
    });

    expect(nivel.nombre).toBe('Test Level');
    expect(nivel.dificultad).toBe('FACIL');
    expect(nivel.ancho).toBe(1);
    expect(nivel.alto).toBe(1);
    expect(nivel.baseNivel).toBe(1000);
    expect(nivel.kmov).toBe(10);
    expect(nivel.ktiempo).toBe(5);
    expect(nivel.umbralEstrella1).toBe(800);
    expect(nivel.umbralEstrella2).toBe(600);
    expect(nivel.umbralEstrella3).toBe(400);
    expect(nivel.limiteTiempo).toBeUndefined();
    expect(nivel.id).toBeDefined();
    expect(typeof nivel.id).toBe('string');
  });

  it('creates a Nivel with limiteTiempo', () => {
    const nivel = Nivel.crear({
      id: 'nivel-timed',
      nombre: 'Timed Level',
      dificultad: 'MEDIO',
      definicionTablero: definicion,
      ancho: 1,
      alto: 1,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
      limiteTiempo: 120,
    });

    expect(nivel.limiteTiempo).toBe(120);
  });

  // Base params for a valid untimed level 1-9; specs override numero/limiteTiempo/esBonus.
  function crearConReglas(
    overrides: Partial<{
      numero: number;
      limiteTiempo: number;
      esBonus: boolean;
    }>,
  ): Nivel {
    return Nivel.crear({
      id: 'nivel-reglas',
      nombre: 'Reglas',
      dificultad: 'FACIL',
      definicionTablero: definicion,
      ancho: 1,
      alto: 1,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
      ...overrides,
    });
  }

  describe('timed-by-ordinal invariant', () => {
    it('should_throw_ReglaTiempoNivelException_when_numero_is_12_and_no_limiteTiempo', () => {
      expect(() => crearConReglas({ numero: 12 })).toThrow(
        ReglaTiempoNivelException,
      );
    });

    it('should_throw_ReglaTiempoNivelException_when_numero_is_4_and_has_limiteTiempo', () => {
      expect(() =>
        crearConReglas({ numero: 4, limiteTiempo: 90 }),
      ).toThrow(ReglaTiempoNivelException);
    });

    it('should_create_a_timed_level_when_numero_is_exactly_10_with_limiteTiempo', () => {
      const nivel = crearConReglas({ numero: 10, limiteTiempo: 90 });

      expect(nivel.numero).toBe(10);
      expect(nivel.limiteTiempo).toBe(90);
    });

    it('should_create_an_untimed_level_when_numero_is_exactly_9_without_limiteTiempo', () => {
      const nivel = crearConReglas({ numero: 9 });

      expect(nivel.numero).toBe(9);
      expect(nivel.limiteTiempo).toBeUndefined();
    });

    it('should_throw_when_numero_is_10_without_limiteTiempo', () => {
      expect(() => crearConReglas({ numero: 10 })).toThrow(
        ReglaTiempoNivelException,
      );
    });

    it('should_throw_when_numero_is_9_with_limiteTiempo', () => {
      expect(() =>
        crearConReglas({ numero: 9, limiteTiempo: 90 }),
      ).toThrow(ReglaTiempoNivelException);
    });
  });

  describe('bonus levels', () => {
    it('should_mark_level_non_scoring_when_esBonus_is_true', () => {
      const nivel = crearConReglas({ numero: 3, esBonus: true });

      expect(nivel.esBonus).toBe(true);
      expect(nivel.esPuntuable).toBe(false);
    });

    it('should_ignore_time_and_ordinal_rule_when_esBonus_is_true', () => {
      // A bonus level may carry any ordinal and any limiteTiempo without violating the
      // timed-by-ordinal rule; the limiteTiempo is dropped because time does not apply.
      const nivel = crearConReglas({
        numero: 12,
        limiteTiempo: 30,
        esBonus: true,
      });

      expect(nivel.limiteTiempo).toBeUndefined();
    });
  });
});
