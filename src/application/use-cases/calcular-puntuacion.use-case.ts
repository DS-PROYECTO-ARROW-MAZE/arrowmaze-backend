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

    const estrellas = this.calcularEstrellas(
      puntaje,
      params.nivel.umbralEstrella1,
      params.nivel.umbralEstrella2,
    );

    return ResultadoPuntaje.puntuado(puntaje, estrellas);
  }

  private seleccionarEstrategia(nivel: Nivel): EstrategiaPuntuacion {
    return nivel.limiteTiempo !== undefined
      ? this.estrategias.get('mixta')!
      : this.estrategias.get('porMovimientos')!;
  }

  private calcularEstrellas(
    puntaje: number,
    umbral1: number,
    umbral2: number,
  ): number {
    if (puntaje >= umbral1) return 3;
    if (puntaje >= umbral2) return 2;
    return 1;
  }
}
