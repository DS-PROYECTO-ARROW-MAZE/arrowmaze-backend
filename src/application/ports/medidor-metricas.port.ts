export const I_MEDIDOR_METRICAS = 'IMedidorMetricas';

export interface IMedidorMetricas {
  registrarDuracion(nombreCasoDeUso: string, duracionMs: number): void;
}
