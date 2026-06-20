import { PuntuacionMixta } from './puntuacion-mixta';
import { Nivel } from '../../aggregates/nivel';
import { DefinicionTablero } from '../../value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../value-objects/celda';
import { Direccion } from '../../value-objects/direccion';

function crearNivelTimed(
  overrides: Partial<{
    baseNivel: number;
    kmov: number;
    ktiempo: number;
    limiteTiempo: number;
  }> = {},
): Nivel {
  const celdas = [[FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)]];
  const definicion = DefinicionTablero.crear(1, 1, celdas);
  return Nivel.crear({
    nombre: 'Test',
    dificultad: 'MEDIO',
    definicionTablero: definicion,
    ancho: 1,
    alto: 1,
    baseNivel: overrides.baseNivel ?? 1000,
    kmov: overrides.kmov ?? 15,
    ktiempo: overrides.ktiempo ?? 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    limiteTiempo: overrides.limiteTiempo ?? 120,
  });
}

describe('PuntuacionMixta', () => {
  const estrategia = new PuntuacionMixta();

  it('should_calculate_mixed_score_when_timed_level', () => {
    const nivel = crearNivelTimed({ baseNivel: 1000, kmov: 15, ktiempo: 5 });
    const resultado = estrategia.calcular(nivel, 10, 30);

    expect(resultado).toBe(1000);
  });

  it('should_floor_score_at_zero_when_result_would_be_negative', () => {
    const nivel = crearNivelTimed({ baseNivel: 100, kmov: 20, ktiempo: 5 });
    const resultado = estrategia.calcular(nivel, 100, 0);

    expect(resultado).toBe(0);
  });

  it('should_return_baseNivel_when_zero_movimientos_and_zero_seconds', () => {
    const nivel = crearNivelTimed({ baseNivel: 1000, kmov: 10 });
    const resultado = estrategia.calcular(nivel, 0, 0);

    expect(resultado).toBe(1000);
  });

  it('should_add_time_bonus_when_seconds_remaining', () => {
    const nivel = crearNivelTimed({ baseNivel: 500, kmov: 10, ktiempo: 3 });
    const resultado = estrategia.calcular(nivel, 0, 20);

    expect(resultado).toBe(560);
  });

  it('should_never_return_negative_score', () => {
    const nivel = crearNivelTimed({ baseNivel: 10, kmov: 100, ktiempo: 1 });
    const resultado = estrategia.calcular(nivel, 999, 0);

    expect(resultado).toBe(0);
  });

  describe.each([
    [1000, 5, 10, 60, 3, 1130],
    [500, 20, 5, 0, 10, 400],
    [200, 50, 4, 10, 2, 20],
    [100, 10, 1, 90, 1, 180],
  ])(
    'golden table: base=%i mov=%i kmov=%i seg=%i ktiempo=%i',
    (baseNivel, movimientos, kmov, segundosRestantes, ktiempo, expected) => {
      it(`should_return_${expected}`, () => {
        const nivel = crearNivelTimed({ baseNivel, kmov, ktiempo });
        expect(estrategia.calcular(nivel, movimientos, segundosRestantes)).toBe(
          expected,
        );
      });
    },
  );
});
