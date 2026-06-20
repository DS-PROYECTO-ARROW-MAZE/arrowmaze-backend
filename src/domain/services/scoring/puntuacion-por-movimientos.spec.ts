import { PuntuacionPorMovimientos } from './puntuacion-por-movimientos';
import { Nivel } from '../../aggregates/nivel';
import { DefinicionTablero } from '../../value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../value-objects/celda';
import { Direccion } from '../../value-objects/direccion';

function crearNivelUntimed(
  overrides: Partial<{ baseNivel: number; kmov: number }> = {},
): Nivel {
  const celdas = [[FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)]];
  const definicion = DefinicionTablero.crear(1, 1, celdas);
  return Nivel.crear({
    nombre: 'Test',
    dificultad: 'FACIL',
    definicionTablero: definicion,
    ancho: 1,
    alto: 1,
    baseNivel: overrides.baseNivel ?? 1000,
    kmov: overrides.kmov ?? 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
  });
}

describe('PuntuacionPorMovimientos', () => {
  const estrategia = new PuntuacionPorMovimientos();

  it('should_calculate_score_dropping_time_term_when_untimed', () => {
    const nivel = crearNivelUntimed({ baseNivel: 1000, kmov: 10 });
    const resultado = estrategia.calcular(nivel, 5);

    expect(resultado).toBe(950);
  });

  it('should_floor_at_zero_when_huge_movimientos', () => {
    const nivel = crearNivelUntimed({ baseNivel: 100, kmov: 20 });
    const resultado = estrategia.calcular(nivel, 9999);

    expect(resultado).toBe(0);
  });

  it('should_never_return_negative_score', () => {
    const nivel = crearNivelUntimed({ baseNivel: 10, kmov: 5 });
    const resultado = estrategia.calcular(nivel, 100);

    expect(resultado).toBe(0);
  });

  it('should_return_baseNivel_when_zero_movimientos', () => {
    const nivel = crearNivelUntimed({ baseNivel: 500, kmov: 10 });
    const resultado = estrategia.calcular(nivel, 0);

    expect(resultado).toBe(500);
  });

  describe.each([
    [1000, 5, 10, 950],
    [500, 20, 5, 400],
    [200, 50, 4, 0],
    [300, 10, 5, 250],
  ])(
    'golden table: base=%i mov=%i kmov=%i',
    (baseNivel, movimientos, kmov, expected) => {
      it(`should_return_${expected}`, () => {
        const nivel = crearNivelUntimed({ baseNivel, kmov });
        expect(estrategia.calcular(nivel, movimientos)).toBe(expected);
      });
    },
  );
});
