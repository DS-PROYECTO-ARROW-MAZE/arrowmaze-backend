import { RankingDto } from '../dtos/ranking.dto';

export const I_CONSULTA_RANKING = Symbol('IConsultaRanking');

export interface IConsultaRanking {
  obtenerTop(idNivel: string, limite: number): Promise<RankingDto>;
}
