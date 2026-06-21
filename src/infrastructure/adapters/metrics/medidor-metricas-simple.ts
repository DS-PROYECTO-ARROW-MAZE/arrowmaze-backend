import { Injectable } from '@nestjs/common';
import { IMedidorMetricas } from '../../../application/ports/medidor-metricas.port';

@Injectable()
export class MedidorMetricasSimple implements IMedidorMetricas {
  registrarDuracion(nombreCasoDeUso: string, duracionMs: number): void {
    console.log(`[metricas] ${nombreCasoDeUso} duracionMs=${duracionMs}`);
  }
}
