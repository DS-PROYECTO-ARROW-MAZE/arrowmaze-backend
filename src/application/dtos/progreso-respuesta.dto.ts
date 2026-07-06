export interface ProgresoRespuestaDto {
  nivelId: string;
  puntaje: number;
  estrellas: number;
  movimientos: number;
  segundosRestantes?: number;
  completadoEn: Date;
}
