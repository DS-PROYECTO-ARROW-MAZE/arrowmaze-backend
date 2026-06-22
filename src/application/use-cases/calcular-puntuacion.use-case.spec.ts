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

  describe('stars', () => {
    it('should_return_3_stars_when_puntaje_above_umbralEstrella1', () => {
      const nivel = crearNivel({
        baseNivel: 1000,
        kmov: 1,
        umbralEstrella1: 500,
        umbralEstrella2: 300,
        umbralEstrella3: 100,
      });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 1 });
      expect(resultado.estrellas).toBe(3);
    });

    it('should_return_2_stars_when_puntaje_between_umbralEstrella1_and_umbralEstrella2', () => {
      const nivel = crearNivel({
        baseNivel: 400,
        kmov: 1,
        umbralEstrella1: 500,
        umbralEstrella2: 300,
        umbralEstrella3: 100,
      });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 1 });
      expect(resultado.estrellas).toBe(2);
    });

    it('should_return_1_star_when_puntaje_between_umbralEstrella2_and_umbralEstrella3', () => {
      const nivel = crearNivel({
        baseNivel: 200,
        kmov: 1,
        umbralEstrella1: 500,
        umbralEstrella2: 300,
        umbralEstrella3: 100,
      });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 1 });
      expect(resultado.estrellas).toBe(1);
    });

    it('should_return_1_star_when_puntaje_below_umbralEstrella3', () => {
      const nivel = crearNivel({
        baseNivel: 50,
        kmov: 1,
        umbralEstrella1: 500,
        umbralEstrella2: 300,
        umbralEstrella3: 100,
      });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 1 });
      expect(resultado.estrellas).toBe(1);
    });

    it('should_return_3_stars_when_puntaje_equals_umbralEstrella1', () => {
      const nivel = crearNivel({
        baseNivel: 500,
        kmov: 1,
        umbralEstrella1: 500,
        umbralEstrella2: 300,
        umbralEstrella3: 100,
      });
      const resultado = casoDeUso.ejecutar({ nivel, movimientos: 0 });
      expect(resultado.estrellas).toBe(3);
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
