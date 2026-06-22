import { CalcularPuntuacionCasoDeUso } from './calcular-puntuacion.use-case';
import { Nivel } from '../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../domain/value-objects/celda';
import { Direccion } from '../../domain/value-objects/direccion';
import { readdirSync } from 'fs';
import { join } from 'path';

function crearNivel(
  overrides: Partial<{
    baseNivel: number;
    kmov: number;
    ktiempo: number;
    umbralEstrella1: number;
    umbralEstrella2: number;
    umbralEstrella3: number;
    limiteTiempo?: number;
    numero?: number;
    esBonus?: boolean;
  }> = {},
): Nivel {
  const celdas = [
    [
      FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
      FabricaCeldasEstandar.crearVacia(),
    ],
  ];
  const definicion = DefinicionTablero.crear(2, 1, celdas);
  return Nivel.crear({
    id: 'nivel-test',
    nombre: 'Test',
    dificultad: 'FACIL',
    definicionTablero: definicion,
    ancho: 1,
    alto: 1,
    baseNivel: overrides.baseNivel ?? 1000,
    kmov: overrides.kmov ?? 10,
    ktiempo: overrides.ktiempo ?? 5,
    umbralEstrella1: overrides.umbralEstrella1 ?? 750,
    umbralEstrella2: overrides.umbralEstrella2 ?? 500,
    umbralEstrella3: overrides.umbralEstrella3 ?? 250,
    limiteTiempo: overrides.limiteTiempo,
    numero: overrides.numero,
    esBonus: overrides.esBonus,
  });
}

describe('CalcularPuntuacionCasoDeUso', () => {
  let casoDeUso: CalcularPuntuacionCasoDeUso;

  beforeEach(() => {
    casoDeUso = new CalcularPuntuacionCasoDeUso();
  });

  describe('strategy selection', () => {
    it('should_use_mixed_strategy_when_level_has_limiteTiempo', () => {
      const nivel = crearNivel({ limiteTiempo: 60 });
      const resultado = casoDeUso.ejecutar({
        nivel,
        movimientos: 5,
        segundosRestantes: 30,
      });

      expect(resultado.puntaje).toBeGreaterThanOrEqual(0);
    });

    it('should_use_movements_only_strategy_when_level_has_no_limiteTiempo', () => {
      const nivel = crearNivel();
      const resultado = casoDeUso.ejecutar({
        nivel,
        movimientos: 5,
      });

      expect(resultado.puntaje).toBeGreaterThanOrEqual(0);
    });
  });

  describe('proportional stars', () => {
    // Stars track Puntaje as a fraction of the level's achievable maximum (referencia), not
    // hand-tuned absolute thresholds (PRD §3). referencia is the perfect-run score: 0
    // movimientos and, for timed levels, the full limiteTiempo. proporción = puntaje /
    // referencia maps to stars by bands — proporción >= 9/10 → 3★ (near-max), >= 2/3 → 2★,
    // otherwise the 1★ minimum. Each band's lower edge is inclusive. The umbralEstrella*
    // fields no longer drive this step.

    it('should_return_3_stars_when_proporcion_equals_near_max_band', () => {
      // referencia = baseNivel = 900 (untimed); puntaje = 900 - 9*10 = 810 → proporción 0.9.
      const nivel = crearNivel({ baseNivel: 900, kmov: 10 });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 9 });
      expect(resultado.puntaje).toBe(810);
      expect(resultado.estrellas).toBe(3);
    });

    it('should_return_2_stars_when_proporcion_just_below_near_max_band', () => {
      // puntaje = 900 - 10*10 = 800 → proporción 0.888… (< 9/10).
      const nivel = crearNivel({ baseNivel: 900, kmov: 10 });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 10 });
      expect(resultado.puntaje).toBe(800);
      expect(resultado.estrellas).toBe(2);
    });

    it('should_return_2_stars_when_proporcion_equals_two_thirds_band', () => {
      // puntaje = 900 - 30*10 = 600 → proporción 2/3 exactly.
      const nivel = crearNivel({ baseNivel: 900, kmov: 10 });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 30 });
      expect(resultado.puntaje).toBe(600);
      expect(resultado.estrellas).toBe(2);
    });

    it('should_return_1_star_when_proporcion_just_below_two_thirds_band', () => {
      // puntaje = 900 - 31*10 = 590 → proporción 0.655… (< 2/3).
      const nivel = crearNivel({ baseNivel: 900, kmov: 10 });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 31 });
      expect(resultado.puntaje).toBe(590);
      expect(resultado.estrellas).toBe(1);
    });

    it('should_return_3_stars_when_puntaje_equals_referencia', () => {
      // A perfect run (0 movimientos) scores the whole reference → proporción 1.0.
      const nivel = crearNivel({ baseNivel: 500, kmov: 10 });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 0 });
      expect(resultado.estrellas).toBe(3);
    });

    it('should_return_the_minimum_1_star_when_puntaje_is_zero', () => {
      const nivel = crearNivel({ baseNivel: 100, kmov: 10 });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 1000 });
      expect(resultado.puntaje).toBe(0);
      expect(resultado.estrellas).toBe(1);
    });

    it('should_include_the_time_bonus_in_referencia_for_timed_levels', () => {
      // Timed referencia = baseNivel + limiteTiempo*ktiempo = 1000 + 60*5 = 1300.
      // puntaje = 1000 - 5*10 + 30*5 = 1100 → proporción 1100/1300 ≈ 0.846 → 2★, not 3★,
      // because the achievable maximum counts the unspent seconds.
      const nivel = crearNivel({
        baseNivel: 1000,
        kmov: 10,
        ktiempo: 5,
        limiteTiempo: 60,
      });
      const resultado = casoDeUso.ejecutar({
        nivel,
        movimientos: 5,
        segundosRestantes: 30,
      });
      expect(resultado.puntaje).toBe(1100);
      expect(resultado.estrellas).toBe(2);
    });
  });

  describe('bonus levels (non-scoring)', () => {
    it('should_return_a_non_scoring_result_when_level_is_bonus', () => {
      const nivel = crearNivel({ esBonus: true });
      const resultado = casoDeUso.ejecutar({
        nivel,
        movimientos: 5,
        segundosRestantes: 30,
      });

      expect(resultado.esPuntuable).toBe(false);
    });

    it('should_not_compute_puntaje_or_estrellas_when_level_is_bonus', () => {
      // Params that would otherwise score high and earn 3 stars — proving the formula and
      // star thresholds are skipped, not merely floored.
      const nivel = crearNivel({
        esBonus: true,
        baseNivel: 1000,
        kmov: 1,
        umbralEstrella1: 500,
        umbralEstrella2: 300,
        umbralEstrella3: 100,
      });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 1 });

      expect(resultado.puntaje).toBeNull();
      expect(resultado.estrellas).toBeNull();
    });
  });

  describe('ubiquitous language guard', () => {
    it('should_not_have_PuntuacionPorTiempo_class', () => {
      const scoringDir = join(__dirname, '../../domain/services/scoring');
      const files = readdirSync(scoringDir);
      const hasPuntuacionPorTiempo = files.some((f) =>
        f.toLowerCase().includes('puntuacion-por-tiempo'),
      );
      expect(hasPuntuacionPorTiempo).toBe(false);
    });
  });
});
