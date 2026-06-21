export interface EntradaRankingDto {
  puntaje: number;
  estrellas: number;
  movimientos: number;
  segundosRestantes: number | null;
  completadoEn: string;
  email: string;
}

export interface RankingDto {
  entradas: EntradaRankingDto[];
}
