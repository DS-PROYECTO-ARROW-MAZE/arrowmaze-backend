import { Nivel } from '../../aggregates/nivel';

export interface EstrategiaPuntuacion {
  calcular(
    nivel: Nivel,
    movimientos: number,
    segundosRestantes?: number,
  ): number;
}
