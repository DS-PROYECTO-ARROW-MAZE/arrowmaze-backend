import { Module } from '@nestjs/common';
import { LeaderboardController } from '../adapters/http/controllers/leaderboard.controller';
import { I_CONSULTA_RANKING } from '../../application/ports/consulta-ranking.port';
import { ConsultaRankingPrisma } from '../adapters/persistence/queries/consulta-ranking-prisma';
import { PrismaModule } from '../adapters/persistence/prisma/prisma.module';
import { InterceptorCacheRanking } from '../adapters/http/interceptors/interceptor-cache-ranking';

@Module({
  imports: [PrismaModule],
  controllers: [LeaderboardController],
  providers: [
    {
      provide: I_CONSULTA_RANKING,
      useClass: ConsultaRankingPrisma,
    },
    InterceptorCacheRanking,
  ],
})
export class LeaderboardModule {}
