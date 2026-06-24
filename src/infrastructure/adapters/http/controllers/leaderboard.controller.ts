import {
  Controller,
  Get,
  Query,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { I_CONSULTA_RANKING } from '../../../../application/ports/consulta-ranking.port';
import type { IConsultaRanking } from '../../../../application/ports/consulta-ranking.port';
import { InterceptorCacheRanking } from '../interceptors/interceptor-cache-ranking';
import { LeaderboardQueryDto } from '../dtos/leaderboard-query.dto';

@Controller('leaderboard')
@UseInterceptors(InterceptorCacheRanking)
export class LeaderboardController {
  constructor(
    @Inject(I_CONSULTA_RANKING)
    private readonly consultaRanking: IConsultaRanking,
  ) {}

  @Get()
  async getTop(@Query() query: LeaderboardQueryDto) {
    return this.consultaRanking.obtenerTop(
      query.idNivel,
      parseInt(query.limite, 10),
    );
  }
}
