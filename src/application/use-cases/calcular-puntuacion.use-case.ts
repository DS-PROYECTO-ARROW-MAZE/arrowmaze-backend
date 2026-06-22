import { Nivel } from '../../domain/aggregates/nivel';
import { EstrategiaPuntuacion } from '../../domain/services/scoring/estrategia-puntuacion.interface';
import { PuntuacionMixta } from '../../domain/services/scoring/puntuacion-mixta';
import { PuntuacionPorMovimientos } from '../../domain/services/scoring/puntuacion-por-movimientos';
import { ResultadoPuntaje } from '../../domain/value-objects/resultado-puntaje';

export interface CalcularPuntuacionParams {
  nivel: Nivel;
  movimientos: number;
  segundosRestantes?: number;
}

type TipoEstrategia = 'mixta' | 'porMovimientos';

// Proportional star bands (PRD §3). proporción = puntaje / referencia, compared with integer
// cross-multiplication (puntaje * den >= referencia * num) so the boundaries are exact and the
// lower edge of each band is inclusive. Anything below the 2★ band collapses to the 1★ minimum.
const BANDA_3_ESTRELLAS_NUM = 9;
const BANDA_3_ESTRELLAS_DEN = 10; // proporción >= 9/10 → 3★ (near-max)
const BANDA_2_ESTRELLAS_NUM = 2;
const BANDA_2_ESTRELLAS_DEN = 3; //  proporción >= 2/3 → 2★

export class CalcularPuntuacionCasoDeUso {
  private readonly estrategias: Map<TipoEstrategia, EstrategiaPuntuacion>;

  constructor() {
    this.estrategias = new Map<TipoEstrategia, EstrategiaPuntuacion>([
      ['mixta', new PuntuacionMixta()],
      ['porMovimientos', new PuntuacionPorMovimientos()],
    ]);
  }

  ejecutar(params: CalcularPuntuacionParams): ResultadoPuntaje {
    // Third path (PRD §3): bonus levels are non-scoring. Decided off the level's own flag,
    // not a strategy subtype — no formula or star thresholds are applied.
    if (params.nivel.esBonus) {
      return ResultadoPuntaje.noPuntuable();
    }

    const estrategia = this.seleccionarEstrategia(params.nivel);
    const puntaje = estrategia.calcular(
      params.nivel,
      params.movimientos,
      params.segundosRestantes ?? 0,
    );

    const referencia = this.calcularReferencia(estrategia, params.nivel);
    const estrellas = this.calcularEstrellas(puntaje, referencia);

    return ResultadoPuntaje.puntuado(puntaje, estrellas);
  }

  private seleccionarEstrategia(nivel: Nivel): EstrategiaPuntuacion {
    return nivel.limiteTiempo !== undefined
      ? this.estrategias.get('mixta')!
      : this.estrategias.get('porMovimientos')!;
  }

  // The achievable maximum: a perfect run scores it with 0 movimientos and, when timed, the
  // full limiteTiempo left on the clock. Reusing the selected strategy keeps referencia in
  // lockstep with the formula, so swapping the strategy needs no change to the star step.
  private calcularReferencia(
    estrategia: EstrategiaPuntuacion,
    nivel: Nivel,
  ): number {
    return estrategia.calcular(nivel, 0, nivel.limiteTiempo ?? 0);
  }

  private calcularEstrellas(puntaje: number, referencia: number): number {
    if (referencia <= 0) return 1;
    if (puntaje * BANDA_3_ESTRELLAS_DEN >= referencia * BANDA_3_ESTRELLAS_NUM) {
      return 3;
    }
    if (puntaje * BANDA_2_ESTRELLAS_DEN >= referencia * BANDA_2_ESTRELLAS_NUM) {
      return 2;
    }
    return 1;
  }
}
