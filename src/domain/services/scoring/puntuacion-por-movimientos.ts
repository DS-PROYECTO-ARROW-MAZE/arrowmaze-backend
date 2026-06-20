import { EstrategiaPuntuacion } from './estrategia-puntuacion.interface';
import { Nivel } from '../../aggregates/nivel';
import { puntajeConSuelo } from './puntaje-con-suelo';

export class PuntuacionPorMovimientos implements EstrategiaPuntuacion {
  calcular(nivel: Nivel, movimientos: number): number {
    const bruto = nivel.baseNivel - movimientos * nivel.kmov;
    return puntajeConSuelo(bruto);
  }
}
