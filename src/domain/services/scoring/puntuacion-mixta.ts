import { EstrategiaPuntuacion } from './estrategia-puntuacion.interface';
import { Nivel } from '../../aggregates/nivel';
import { puntajeConSuelo } from './puntaje-con-suelo';

export class PuntuacionMixta implements EstrategiaPuntuacion {
  calcular(
    nivel: Nivel,
    movimientos: number,
    segundosRestantes: number = 0,
  ): number {
    const bruto =
      nivel.baseNivel -
      movimientos * nivel.kmov +
      segundosRestantes * nivel.ktiempo;
    return puntajeConSuelo(bruto);
  }
}
