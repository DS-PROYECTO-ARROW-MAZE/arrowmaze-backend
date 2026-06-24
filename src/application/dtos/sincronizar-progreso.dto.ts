export interface ProgresoEntradaDto {
  nivelId: string;
  movimientos: number;
  segundosRestantes?: number;
  completadoEn: string;
}

export interface SincronizarProgresoDto {
  jugadorId: string;
  progresos: ProgresoEntradaDto[];
}

export interface SincronizarProgresoResultadoDto {
  guardados: number;
}
